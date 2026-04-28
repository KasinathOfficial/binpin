import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppMap from './components/Map';
import Splash from './components/Splash';
import TopBar from './components/TopBar';
import BottomBar from './components/BottomBar';
import FloatingElements from './components/FloatingElements';
import BinDetailSheet from './components/BinDetailSheet';
import AddBinSheet from './components/AddBinSheet';
import FeedbackSheet from './components/FeedbackSheet';
import BinListSheet from './components/BinListSheet';
import RequestBinSheet from './components/RequestBinSheet';
import RequestDetailSheet from './components/RequestDetailSheet';
import { databases, client, ID } from './lib/appwrite';
import type { Bin, BinRequest } from './lib/appwrite';
import { Query } from 'appwrite';

const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const binsId = import.meta.env.VITE_APPWRITE_BINS_COLLECTION_ID;
const feedbackId = import.meta.env.VITE_APPWRITE_FEEDBACK_COLLECTION_ID;
const reportsId = import.meta.env.VITE_APPWRITE_REPORTS_COLLECTION_ID;
const reqsId = import.meta.env.VITE_APPWRITE_REQUESTS_COLLECTION_ID;
import { getDistance, formatDistance } from './lib/geo';

export default function MainApp() {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [mapTheme, setMapTheme] = useState<'light' | 'dark'>('dark');
  
  // Data
  const [bins, setBins] = useState<Bin[]>([]);
  const [requests, setRequests] = useState<BinRequest[]>([]);
  const [filterDist, setFilterDist] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI Sheets
  const [activeBin, setActiveBin] = useState<Bin | null>(null);
  const [activeReq, setActiveReq] = useState<BinRequest | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isFeedback, setIsFeedback] = useState(false);
  const [isBinList, setIsBinList] = useState(false);

  useEffect(() => {
    fetchBins();
    fetchRequests();
    
    if (dbId && binsId && reqsId) {
      // Small delay to ensure WebSocket is ready
      const timer = setTimeout(() => {
        const channels = [
          `databases.${dbId}.collections.${binsId}.documents`,
          `databases.${dbId}.collections.${reqsId}.documents`
        ];
        
        const sub = client.subscribe(channels, (response) => {
          const payload = response.payload as any;
          const id = payload.$id;
          
          // Check which collection the update belongs to
          const isBin = response.channels.some(c => c.includes(binsId));
          const isReq = response.channels.some(c => c.includes(reqsId));

          if (isBin) {
            const mappedBin = { ...payload, id } as unknown as Bin;
            if (response.events.includes("databases.*.collections.*.documents.*.create")) {
              setBins(prev => [...prev, mappedBin]);
            } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
              setBins(prev => prev.map(b => b.id === id ? mappedBin : b));
            } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
              setBins(prev => prev.filter(b => b.id !== id));
            }
          } else if (isReq) {
            const mappedReq = { ...payload, id } as unknown as BinRequest;
            if (response.events.includes("databases.*.collections.*.documents.*.create")) {
              setRequests(prev => [...prev, mappedReq]);
            } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
              setRequests(prev => prev.map(r => r.id === id ? mappedReq : r));
            } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
              setRequests(prev => prev.filter(r => r.id !== id));
            }
          }
        });
        
        return () => sub();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, []);

  const fetchRequests = async () => {
    if(!dbId || !reqsId) return;
    try {
      const resp = await databases.listDocuments(dbId, reqsId);
      setRequests(resp.documents.map(d => ({ ...d, id: d.$id })) as unknown as BinRequest[]);
    } catch(e: any) { 
      if (e.code === 404) {
        console.warn(`Requests collection (${reqsId}) not found. Features depending on requests will be disabled.`);
      } else {
        console.error("Appwrite fetch error", e); 
      }
    }
  };

  const fetchBins = async () => {
    if(!dbId || !binsId) return;
    try {
      const resp = await databases.listDocuments(dbId, binsId, [Query.equal('is_deleted', false)]);
      setBins(resp.documents.map(d => ({ ...d, id: d.$id })) as unknown as Bin[]);
    } catch(e) { console.warn("Appwrite fetch error", e); }
  };

  const handleStart = () => {
    setShowSplash(false);
    if (navigator.geolocation) {
      // Get an initial position quickly (low accuracy)
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
        null,
        { enableHighAccuracy: false, timeout: 5000 }
      );

      // Start high-accuracy tracking with robust timeout handling
      navigator.geolocation.watchPosition(
        (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
        (err) => {
          if (err.code === err.TIMEOUT) {
            console.warn('GPS signal acquisition taking longer than expected... will keep trying.');
          } else {
            console.warn('High-accuracy loc error', err);
          }
        },
        { 
          enableHighAccuracy: true, 
          maximumAge: 0, 
          timeout: 60000 // 1 minute timeout for high-accuracy cold starts
        }
      );
    }
  };

  // Derived state
  const visibleBins = useMemo(() => {
    let list = bins;
    
    if (searchQuery) {
      list = list.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()) || (b.notes && b.notes.toLowerCase().includes(searchQuery.toLowerCase())));
    }
    
    if (filterDist > 0 && userLoc) {
      list = list.filter(b => getDistance(userLoc[0], userLoc[1], b.lat, b.lng) <= filterDist);
    }
    
    return list;
  }, [bins, searchQuery, filterDist, userLoc]);

  const nearestBinInfo = useMemo(() => {
    if (!userLoc || bins.length === 0) return undefined;
    let minD = Infinity;
    let nearest: Bin | null = null;
    for (const b of bins) {
      const d = getDistance(userLoc[0], userLoc[1], b.lat, b.lng);
      if (d < minD) { minD = d; nearest = b; }
    }
    if (nearest) return { distance: formatDistance(minD), bin: nearest };
    return undefined;
  }, [bins, userLoc]);

  const stats = useMemo(() => {
    const citySet = new Set<string>();
    bins.forEach(b => {
      const city = b.name.split(',').pop()?.trim();
      if (city) citySet.add(city);
    });
    requests.forEach(r => {
      if (r.city) citySet.add(r.city);
    });

    return {
      totalBins: bins.length,
      cityCount: citySet.size,
      openRequests: requests.filter(r => r.status === 'requested' || r.status === 'under_review').length
    };
  }, [bins, requests]);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-background">
      {showSplash && <Splash onStart={handleStart} />}

      {!showSplash && (
        <>
          <AppMap 
            userLocation={userLoc}
            bins={visibleBins}
            requests={requests}
            onBinClick={(b) => setActiveBin(b)}
            onRequestClick={(r) => setActiveReq(r)}
            interactive={!isAdding && !activeBin && !isFeedback && !isRequesting && !activeReq}
            theme={mapTheme}
          />

          <TopBar 
            onSearch={setSearchQuery}
            onFeedbackClick={() => setIsFeedback(true)}
            theme={mapTheme}
            onToggleTheme={() => setMapTheme(t => t === 'dark' ? 'light' : 'dark')}
            onAddClick={() => setIsAdding(true)}
            onRequestClick={() => setIsRequesting(true)}
            onMunicipalClick={() => navigate('/transparency')}
          />
          
          <FloatingElements 
            nearestBin={nearestBinInfo ? { distance: nearestBinInfo.distance, name: nearestBinInfo.bin.name } : undefined}
            onNearestClick={() => nearestBinInfo && setActiveBin(nearestBinInfo.bin)}
          />
          
          <BottomBar 
            onListClick={() => setIsBinList(true)}
            stats={stats}
          />

          {isBinList && (
            <BinListSheet
              bins={visibleBins}
              userLocation={userLoc}
              onClose={() => setIsBinList(false)}
              onSelectBin={(b) => {
                setIsBinList(false);
                setActiveBin(b);
              }}
            />
          )}

          {activeBin && (
            <BinDetailSheet 
              bin={activeBin}
              userLocation={userLoc}
              onClose={() => setActiveBin(null)}
              onHelpful={async () => {
                if(!dbId || !binsId) return;
                try {
                  const doc = await databases.getDocument(dbId, binsId, activeBin.id);
                  await databases.updateDocument(dbId, binsId, activeBin.id, { upvote_count: doc.upvote_count + 1 });
                } catch(e) {}
              }}
              onReport={async () => {
                if(!dbId || !binsId || !reportsId) return;
                try {
                  await databases.createDocument(dbId, reportsId, ID.unique(), { bin_id: activeBin.id, reason: 'Flagged by user' });
                  const doc = await databases.getDocument(dbId, binsId, activeBin.id);
                  await databases.updateDocument(dbId, binsId, activeBin.id, { report_count: doc.report_count + 1 });
                  alert('Bin reported.');
                } catch(e) {}
              }}
            />
          )}

          {activeReq && (
            <RequestDetailSheet
              request={activeReq}
              onClose={() => setActiveReq(null)}
              onUpvote={async () => {
                if(!dbId || !reqsId) return;
                try {
                  const doc = await databases.getDocument(dbId, reqsId, activeReq.id);
                  await databases.updateDocument(dbId, reqsId, activeReq.id, { upvote_count: doc.upvote_count + 1 });
                } catch(e) {}
              }}
              onMunicipalAction={() => navigate(`/submit-action/${activeReq.id}`)}
            />
          )}

          {isAdding && (
            <AddBinSheet 
              userLocation={userLoc}
              onClose={() => setIsAdding(false)}
              onSubmit={async (data) => {
                if(dbId && binsId) {
                   await databases.createDocument(dbId, binsId, ID.unique(), data);
                }
                setIsAdding(false);
              }}
            />
          )}

          {isRequesting && (
            <RequestBinSheet 
              userLocation={userLoc}
              onClose={() => setIsRequesting(false)}
              onSubmit={async (data) => {
                if(dbId && reqsId) {
                   await databases.createDocument(dbId, reqsId, ID.unique(), {
                     ...data,
                     status: 'requested',
                     upvote_count: 1
                   });
                   alert('Request submitted for municipal review.');
                }
                setIsRequesting(false);
              }}
            />
          )}

          {isFeedback && (
            <FeedbackSheet 
              onClose={() => setIsFeedback(false)}
              onSubmit={async (data) => {
                if(dbId && feedbackId) {
                  await databases.createDocument(dbId, feedbackId, ID.unique(), { ...data, device_type: window.innerWidth <= 768 ? 'mobile' : 'desktop' });
                  alert("Thanks for your feedback!");
                }
                setIsFeedback(false);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
