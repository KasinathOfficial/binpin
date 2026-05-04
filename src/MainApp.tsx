import { useState, useEffect, useMemo } from 'react';
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
import InstallBanner from './components/InstallBanner';
import SuccessCelebration from './components/SuccessCelebration';
import OnboardingSheet from './components/OnboardingSheet';
import { databases, storage, client, ID } from './lib/appwrite';
import type { Bin, BinRequest } from './lib/appwrite';
import { Query } from 'appwrite';
import { getDistance, formatDistance } from './lib/geo';
import { addUpvotedRequest } from './lib/votes';
import { compressImage } from './lib/image';
import { Loader2 } from 'lucide-react';

const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const binsId = import.meta.env.VITE_APPWRITE_BINS_COLLECTION_ID;
const feedbackId = import.meta.env.VITE_APPWRITE_FEEDBACK_COLLECTION_ID;
const reportsId = import.meta.env.VITE_APPWRITE_REPORTS_COLLECTION_ID;
const reqsId = import.meta.env.VITE_APPWRITE_REQUESTS_COLLECTION_ID;
const bucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID;

async function uploadPhoto(file: File): Promise<string | null> {
  if (!bucketId) {
    console.error('Appwrite Bucket ID is missing');
    return null;
  }
  if (!file || !(file instanceof File)) {
    console.warn('Invalid file object provided to uploadPhoto');
    return null;
  }

  // Compress image before upload
  let fileToUpload = file;
  try {
    console.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    fileToUpload = await compressImage(file);
    console.log(`Compressed size: ${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`);
  } catch (err) {
    console.warn('Compression failed, using original file', err);
  }

  // 10MB limit check (after compression)
  if (fileToUpload.size > 10 * 1024 * 1024) {
    alert('Photo is too large (Max 10MB even after compression).');
    return null;
  }

  try {
    const uploaded = await storage.createFile(bucketId, ID.unique(), fileToUpload);
    let endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
    // Sanitize endpoint: remove trailing slash if present
    endpoint = endpoint.replace(/\/$/, '');
    
    const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '69ed94eb0033f1ed70e4';
    return `${endpoint}/storage/buckets/${bucketId}/files/${uploaded.$id}/view?project=${projectId}`;
  } catch (e: any) {
    console.error('Photo upload failed:', e.message || e);
    // If it's a "Failed to fetch", it's likely a network/CORS issue
    if (e.message?.includes('Failed to fetch')) {
      alert('Network Error: Photo upload failed. Please check your internet or if the Appwrite project is active.');
    } else {
      alert('Photo upload failed: ' + (e.message || 'Check Appwrite permissions or file size.'));
    }
    return null;
  }
}

export default function MainApp() {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [mapTheme, setMapTheme] = useState<'light' | 'dark'>('light');
  
  // Data
  const [bins, setBins] = useState<Bin[]>([]);
  const [requests, setRequests] = useState<BinRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI Sheets
  const [activeBin, setActiveBin] = useState<Bin | null>(null);
  const [activeReq, setActiveReq] = useState<BinRequest | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingBin, setEditingBin] = useState<Bin | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isFeedback, setIsFeedback] = useState(false);
  const [isBinList, setIsBinList] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successType, setSuccessType] = useState<'add' | 'update' | 'request'>('add');
  const [isHelp, setIsHelp] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem('binpin_visited');
    if (!hasVisited) {
      setIsNewUser(true);
    }
  }, []);


  useEffect(() => {
    fetchBins();
    fetchRequests();
    
    if (dbId && binsId && reqsId) {
      const timer = setTimeout(() => {
        const channels = [
          `databases.${dbId}.collections.${binsId}.documents`,
          `databases.${dbId}.collections.${reqsId}.documents`
        ];
        
        const sub = client.subscribe(channels, (response) => {
          const payload = response.payload as any;
          const id = payload.$id;
          const created_at = payload.$createdAt;
          const isBin = response.channels.some(c => c.includes(binsId));
          const isReq = response.channels.some(c => c.includes(reqsId));

          if (isBin) {
            const mappedBin = { ...payload, id, created_at } as unknown as Bin;
            if (response.events.includes("databases.*.collections.*.documents.*.create")) {
              setBins(prev => [...prev, mappedBin]);
            } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
              setBins(prev => prev.map(b => b.id === id ? mappedBin : b));
            } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
              setBins(prev => prev.filter(b => b.id !== id));
            }
          } else if (isReq) {
            const mappedReq = { ...payload, id, created_at } as unknown as BinRequest;
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

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
        null,
        { enableHighAccuracy: false, timeout: 10000 }
      );

      const watchId = navigator.geolocation.watchPosition(
        (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.warn('Loc error', err),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 60000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);


  // Auto-show Help/Onboarding if permissions are missing
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const locStatus = await navigator.permissions.query({ name: 'geolocation' });
        if (locStatus.state !== 'granted') {
          const hasShown = sessionStorage.getItem('binpin_help_shown');
          if (!hasShown) {
            setIsHelp(true);
            sessionStorage.setItem('binpin_help_shown', 'true');
          }
        }
      } catch (e) {
        const hasShown = sessionStorage.getItem('binpin_help_shown');
        if (!hasShown) {
          setIsHelp(true);
          sessionStorage.setItem('binpin_help_shown', 'true');
        }
      }
    };

    if (!showSplash) {
      checkOnboarding();
    }
  }, [showSplash]);

  const fetchRequests = async () => {
    if(!dbId || !reqsId) return;
    try {
      const resp = await databases.listDocuments(dbId, reqsId);
      setRequests(resp.documents.map(d => ({ ...d, id: d.$id, created_at: d.$createdAt })) as unknown as BinRequest[]);
    } catch(e: any) { 
      console.warn("Appwrite fetch error", e);
    }
  };

  const fetchBins = async () => {
    if(!dbId || !binsId) return;
    try {
      const resp = await databases.listDocuments(dbId, binsId, [Query.equal('is_deleted', false)]);
      setBins(resp.documents.map(d => ({ ...d, id: d.$id, created_at: d.$createdAt })) as unknown as Bin[]);
    } catch(e) { console.warn("Appwrite fetch error", e); }
  };

  const handleStart = () => {
    setShowSplash(false);
  };

  const visibleBins = useMemo(() => {
    let list = bins;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(b => 
        (b.name?.toLowerCase().includes(q)) || 
        (b.notes?.toLowerCase().includes(q)) ||
        (b.city?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [bins, searchQuery]);

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
    bins.forEach(b => { if (b.city) citySet.add(b.city); });
    requests.forEach(r => { if (r.city) citySet.add(r.city); });
    return {
      totalBins: bins.length,
      cityCount: citySet.size,
      openRequests: requests.filter(r => r.status === 'requested' || r.status === 'under_review').length
    };
  }, [bins, requests]);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-background">
      {showSplash && <Splash onStart={handleStart} />}
      <InstallBanner />

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
            onHelpClick={() => {
              setIsHelp(true);
              setIsNewUser(false);
              localStorage.setItem('binpin_visited', 'true');
            }}
            isNewUser={isNewUser}
          />
          
          <FloatingElements 
            nearestBin={nearestBinInfo ? { distance: nearestBinInfo.distance, name: nearestBinInfo.bin.name } : undefined}
            onNearestClick={() => nearestBinInfo && setActiveBin(nearestBinInfo.bin)}
          />
          
          <BottomBar 
            onListClick={() => setIsBinList(true)}
            stats={stats}
            activeFilter={0}
            onFilterChange={() => {}}
          />

          {isBinList && (
            <BinListSheet
              bins={visibleBins}
              userLocation={userLoc}
              onClose={() => setIsBinList(false)}
              onAddClick={() => { setIsBinList(false); setIsAdding(true); }}
              onRequestClick={() => { setIsBinList(false); setIsRequesting(true); }}
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
              onReport={async (reason) => {
                if(!dbId || !binsId || !reportsId) return;
                try {
                  await databases.createDocument(dbId, reportsId, ID.unique(), { bin_id: activeBin.id, reason });
                  const doc = await databases.getDocument(dbId, binsId, activeBin.id);
                  await databases.updateDocument(dbId, binsId, activeBin.id, { report_count: doc.report_count + 1 });
                  alert('Thank you for reporting. Our team will review this shortly.');
                } catch(e) {}
              }}
              onSuggestEdit={() => {
                setEditingBin(activeBin);
                setActiveBin(null);
                setIsAdding(true);
              }}
            />
          )}

          {activeReq && (
            <RequestDetailSheet
              request={activeReq}
              onClose={() => setActiveReq(null)}
              onUpvote={async () => {
                if(!dbId || !reqsId) return;
                addUpvotedRequest(activeReq.id);
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
              initialData={editingBin || undefined}
              onClose={() => { setIsAdding(false); setEditingBin(null); }}
              onSubmit={async (data) => {
                if (dbId && binsId) {
                  setIsGlobalLoading(true);
                  try {
                    const { photoFile, ...rest } = data;
                    const photo_url = photoFile ? await uploadPhoto(photoFile) : (editingBin?.photo_url || null);
                    
                    if (editingBin) {
                      // Update existing bin
                      await databases.updateDocument(dbId, binsId, editingBin.id, {
                        ...rest,
                        photo_url,
                      });
                      setSuccessType('update');
                      setIsSuccess(true);
                    } else {
                      // Create new bin
                      await databases.createDocument(dbId, binsId, ID.unique(), {
                        ...rest,
                        photo_url,
                        upvote_count: 0,
                        report_count: 0,
                        is_deleted: false,
                      });
                      setSuccessType('add');
                      setIsSuccess(true);
                    }
                    setIsAdding(false);
                    setEditingBin(null);
                  } catch (e: any) {
                    alert(`Failed to save bin: ${e.message || 'Unknown error'}`);
                  } finally {
                    setIsGlobalLoading(false);
                  }
                }
              }}
            />
          )}

          {isRequesting && (
            <RequestBinSheet
              userLocation={userLoc}
              onClose={() => setIsRequesting(false)}
              onSubmit={async (data) => {
                if (dbId && reqsId) {
                  setIsGlobalLoading(true);
                  try {
                    const { photoFile, ...rest } = data;
                    const photo_url = photoFile ? await uploadPhoto(photoFile) : null;
                    await databases.createDocument(dbId, reqsId, ID.unique(), {
                      ...rest,
                      photo_url,
                      status: 'requested',
                      upvote_count: 1,
                    });
                    setSuccessType('request');
                    setIsSuccess(true);
                    setIsRequesting(false);
                  } catch (e: any) {
                    alert(`Failed to submit request: ${e.message || 'Unknown error'}`);
                  } finally {
                    setIsGlobalLoading(false);
                  }
                }
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

          {isSuccess && <SuccessCelebration type={successType} onClose={() => setIsSuccess(false)} />}
          
          {isHelp && <OnboardingSheet onClose={() => setIsHelp(false)} />}
          
          {isGlobalLoading && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center text-white">
              <div className="bg-surface-raised p-8 rounded-3xl flex flex-col items-center gap-4 shadow-strong border border-white/10 animate-scale-in">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <div className="flex flex-col items-center gap-1">
                  <p className="text-xl font-bold">Syncing with BinPin...</p>
                  <p className="text-sm text-foreground-muted">Optimizing and uploading your contribution</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
