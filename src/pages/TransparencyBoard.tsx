import { useState, useEffect } from 'react';
import { ChevronLeft, Search, Filter, CheckCircle2, Clock, Shield, MapPin, ThumbsUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { databases, client } from '../lib/appwrite';
import type { BinRequest, MunicipalAction } from '../lib/appwrite';
import { Query } from 'appwrite';
import { formatDistanceToNow } from 'date-fns';
import RequestDeepDetail from '../components/RequestDeepDetail';
import { hasUpvotedRequest, addUpvotedRequest } from '../lib/votes';

const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const reqId = import.meta.env.VITE_APPWRITE_REQUESTS_COLLECTION_ID;
const actionId = import.meta.env.VITE_APPWRITE_ACTIONS_COLLECTION_ID;


export default function TransparencyBoard() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<BinRequest[]>([]);
  const [actions, setActions] = useState<MunicipalAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'requested' | 'under_review' | 'action_taken' | 'installed'>('all');
  const [selectedReq, setSelectedReq] = useState<BinRequest | null>(null);

  useEffect(() => {
    fetchData();
    
    if (dbId && reqId && actionId) {
      const channels = [
        `databases.${dbId}.collections.${reqId}.documents`,
        `databases.${dbId}.collections.${actionId}.documents`
      ];

      const sub = client.subscribe(channels, (response) => {
        const payload = response.payload as any;
        const id = payload.$id;
        const isReq = response.channels.some(c => c.includes(reqId));
        const isAction = response.channels.some(c => c.includes(actionId));

        if (isReq) {
          const mapped = { ...payload, id, created_at: payload.$createdAt } as unknown as BinRequest;
          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            setRequests(prev => [mapped, ...prev]);
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            setRequests(prev => prev.map(r => r.id === id ? mapped : r));
          } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
            setRequests(prev => prev.filter(r => r.id !== id));
          }
        } else if (isAction) {
          const mapped = { ...payload, id, created_at: payload.$createdAt } as unknown as MunicipalAction;
          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            setActions(prev => [...prev, mapped]);
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            setActions(prev => prev.map(a => a.id === id ? mapped : a));
          } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
            setActions(prev => prev.filter(a => a.id !== id));
          }
        }
      });
      return () => sub();
    }
  }, []);

  const fetchData = async () => {
    try {
      if (!dbId || !reqId || !actionId) return;
      
      const [reqsData, actionsData] = await Promise.all([
        databases.listDocuments(dbId, reqId, [Query.orderDesc('$createdAt'), Query.limit(100)]),
        databases.listDocuments(dbId, actionId, [Query.limit(100)])
      ]);

      setRequests(reqsData.documents.map(d => ({ ...d, id: d.$id, created_at: d.$createdAt })) as unknown as BinRequest[]);
      setActions(actionsData.documents.map(d => ({ ...d, id: d.$id, created_at: d.$createdAt })) as unknown as MunicipalAction[]);
    } catch (e: any) {
      console.error("TransparencyBoard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (req: BinRequest) => {
    if (!dbId || !reqId) return;
    if (hasUpvotedRequest(req.id)) return;
    
    addUpvotedRequest(req.id);
    try {
      const doc = await databases.getDocument(dbId, reqId, req.id);
      await databases.updateDocument(dbId, reqId, req.id, {
        upvote_count: doc.upvote_count + 1
      });
      // Refresh local state
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, upvote_count: r.upvote_count + 1 } : r));
    } catch (e) {}
  };


  const filteredRequests = requests.filter(req => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = req.description.toLowerCase().includes(query) || 
                         (req.city && req.city.toLowerCase().includes(query)) ||
                         (req.address && req.address.toLowerCase().includes(query));
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold uppercase tracking-widest text-foreground-muted">Auditing Public Data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col container mx-auto max-w-lg overflow-x-hidden pb-20">
      
      <div className="bg-white/95 backdrop-blur-xl border-b border-border shadow-sm sticky top-0 z-[1000] p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-surface-raised rounded-full active:scale-90 transition-all">
              <ChevronLeft className="w-6 h-6 text-foreground" />
            </button>
            <h1 className="text-lg font-black text-foreground tracking-tight">Transparency Board</h1>
          </div>
          <Shield className="w-5 h-5 text-primary opacity-50" />
        </div>

        <div className="space-y-3">
          <div className="bg-surface rounded-xl flex items-center px-3 py-2 border border-border">
            <Search className="w-4 h-4 text-foreground-muted mr-2" />
            <input 
              type="text" 
              placeholder="Search city, address or issue..." 
              className="bg-transparent border-none outline-none w-full text-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {(['all', 'requested', 'under_review', 'installed'] as const).map(s => {
              const labels: Record<string, string> = {
                all: 'All Data',
                requested: 'Pending',
                under_review: 'Under Review',
                installed: 'Resolved'
              };
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border transition-all ${
                    statusFilter === s 
                    ? 'bg-primary text-white border-primary shadow-subtle' 
                    : 'bg-white text-foreground-secondary border-border hover:bg-surface-raised'
                  }`}
                >
                  {labels[s]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-surface-raised rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-foreground-muted" />
            </div>
            <p className="text-foreground-muted font-bold text-sm">No requests found matches your criteria.</p>
          </div>
        ) : (
          filteredRequests.map(req => {
            const isVoted = hasUpvotedRequest(req.id);

            return (
              <div 
                key={req.id} 
                className="bg-white rounded-2xl border transition-all duration-300 shadow-subtle overflow-hidden border-border"
                onClick={() => setSelectedReq(req)}
              >
                <div className="p-4 flex items-start gap-3 cursor-pointer active:bg-surface-raised/50">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    req.status === 'installed' ? 'bg-primary/10 text-primary' : 'bg-orange/10 text-orange'
                  }`}>
                    {req.status === 'installed' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                           <MapPin className="w-3 h-3" /> {req.city || 'Regional Area'}
                        </p>
                        <p className="text-[9px] font-bold text-foreground-muted mt-0.5">
                          {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpvote(req);
                        }}
                        disabled={isVoted}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full border transition-all active:scale-95 ${
                          isVoted ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white border-border text-foreground-muted hover:border-primary/50 hover:text-primary'
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${isVoted ? 'fill-current' : ''}`} />
                        <span className="text-[10px] font-black">{req.upvote_count}</span>
                      </button>
                    </div>
                    <p className="text-sm font-black text-foreground line-clamp-1 mt-1">{req.description}</p>
                    {req.address && (
                      <p className="text-[10px] text-foreground-muted line-clamp-1 italic mt-0.5">@ {req.address}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-md border ${
                          req.status === 'installed' ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-orange/5 border-orange/20 text-orange'
                        }`}>
                          {req.status === 'installed' ? 'Resolved' : req.status === 'requested' ? 'Pending' : req.status.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[9px] font-black text-primary/70 uppercase tracking-widest flex items-center gap-1">
                        View Audit →
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-surface to-transparent pointer-events-none">
        <div className="max-w-lg mx-auto bg-foreground text-white p-3 rounded-2xl shadow-strong flex items-center justify-between pointer-events-auto ring-1 ring-white/10">
          <div className="flex items-center gap-4 px-2">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Regional</span>
              <span className="text-sm font-black">{requests.length}</span>
            </div>
            <div className="w-[1px] h-6 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-orange">Pending</span>
              <span className="text-sm font-black">{requests.filter(r => r.status === 'requested').length}</span>
            </div>
            <div className="w-[1px] h-6 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-primary">Resolved</span>
              <span className="text-sm font-black">{requests.filter(r => r.status === 'installed').length}</span>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="bg-white text-foreground px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all">
            Home
          </button>
        </div>
      </div>

      {selectedReq && (
        <RequestDeepDetail 
          request={selectedReq} 
          action={actions.find(a => a.request_id === selectedReq.id)}
          onClose={() => setSelectedReq(null)}
          onUpvote={() => handleUpvote(selectedReq)}
        />
      )}
    </div>
  );
}
