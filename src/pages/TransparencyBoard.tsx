import { useState, useEffect } from 'react';
import { ChevronLeft, Search, Filter, AlertCircle, CheckCircle2, Clock, MapPin, Image as ImageIcon, Camera, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { databases, storage, ID } from '../lib/appwrite';
import type { BinRequest, MunicipalAction } from '../lib/appwrite';
import { Query } from 'appwrite';
import { formatDistanceToNow } from 'date-fns';

const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const reqId = import.meta.env.VITE_APPWRITE_REQUESTS_COLLECTION_ID;
const actionId = import.meta.env.VITE_APPWRITE_ACTIONS_COLLECTION_ID;
const bucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID;

export default function TransparencyBoard() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<BinRequest[]>([]);
  const [actions, setActions] = useState<MunicipalAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'requested' | 'under_review' | 'action_taken' | 'installed'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Municipal Update State
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'action_taken' | 'installed'>('action_taken');
  const [updateProof, setUpdateProof] = useState<File | null>(null);
  const [updateDesignation, setUpdateDesignation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
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

  const handleUpdateAction = async (requestId: string) => {
    if (!dbId || !reqId || !actionId || !bucketId) return;
    setSubmitting(true);
    try {
      let proofUrl = '';
      if (updateProof) {
        const file = await storage.createFile(bucketId, ID.unique(), updateProof);
        proofUrl = `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${file.$id}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`;
      }

      // 1. Create Municipal Action Record
      await databases.createDocument(dbId, actionId, ID.unique(), {
        request_id: requestId,
        designation: updateDesignation || "Municipal Officer",
        action_taken: updateStatus === 'installed' ? "Bin Installed" : "Work in Progress",
        proof_url: proofUrl,
      });

      // 2. Update Request Status
      await databases.updateDocument(dbId, reqId, requestId, {
        status: updateStatus
      });

      await fetchData();
      setIsUpdating(null);
      setUpdateProof(null);
      setUpdateDesignation('');
    } catch (e: any) {
      alert("Error updating action: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (req.city && req.city.toLowerCase().includes(searchQuery.toLowerCase()));
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
      
      {/* Sticky Top Header */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-border shadow-sm sticky top-0 z-[1000] p-4 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-surface-raised rounded-full active:scale-90 transition-all">
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-lg font-black text-foreground tracking-tight">Transparency Board</h1>
        </div>

        {/* Search & Filters */}
        <div className="space-y-3">
          <div className="bg-surface rounded-xl flex items-center px-3 py-2 border border-border">
            <Search className="w-4 h-4 text-foreground-muted mr-2" />
            <input 
              type="text" 
              placeholder="Search by city or description..." 
              className="bg-transparent border-none outline-none w-full text-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {(['all', 'requested', 'under_review', 'installed'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border transition-all ${
                  statusFilter === s 
                  ? 'bg-primary text-white border-primary shadow-subtle' 
                  : 'bg-white text-foreground-secondary border-border hover:bg-surface-raised'
                }`}
              >
                {s === 'all' ? 'All Data' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Request List */}
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
            const isExpanded = expandedId === req.id;
            const reqAction = actions.find(a => a.request_id === req.id);

            return (
              <div 
                key={req.id} 
                className={`bg-white rounded-2xl border transition-all duration-300 shadow-subtle overflow-hidden ${isExpanded ? 'border-primary ring-1 ring-primary/20' : 'border-border'}`}
              >
                {/* Compact Card Header */}
                <div 
                  className="p-4 flex items-start gap-3 cursor-pointer active:bg-surface-raised/50"
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    req.status === 'installed' ? 'bg-primary/10 text-primary' : 'bg-orange/10 text-orange'
                  }`}>
                    {req.status === 'installed' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-foreground-muted truncate">
                        {req.city || 'Regional'} · {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                      </p>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-foreground-muted" /> : <ChevronDown className="w-4 h-4 text-foreground-muted" />}
                    </div>
                    <p className="text-sm font-bold text-foreground line-clamp-2 mt-0.5">{req.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`text-[9px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-md border ${
                        req.status === 'installed' ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-orange/5 border-orange/20 text-orange'
                      }`}>
                        {req.status.replace('_', ' ')}
                      </span>
                      <span className="text-[9px] font-black text-foreground-muted/70 uppercase tracking-widest">
                        {req.upvote_count} Citizens Voted
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 animate-slide-up">
                    <div className="h-[1px] bg-border mb-4" />
                    
                    {/* Media Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {req.photo_url ? (
                        <div className="aspect-square rounded-xl overflow-hidden border border-border bg-surface relative">
                          <img src={req.photo_url} alt="Problem" className="w-full h-full object-cover" />
                          <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-md text-white text-[8px] font-bold px-2 py-1 rounded-md uppercase">Original Issue</div>
                        </div>
                      ) : (
                        <div className="aspect-square rounded-xl bg-surface flex flex-col items-center justify-center text-foreground-muted border border-dashed border-border">
                          <ImageIcon className="w-6 h-6 mb-1 opacity-20" />
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">No Photo</span>
                        </div>
                      )}

                      {/* Proof Photo if action taken */}
                      {reqAction?.proof_url ? (
                        <div className="aspect-square rounded-xl overflow-hidden border border-primary/30 bg-primary/5 relative">
                          <img src={reqAction.proof_url} alt="Proof" className="w-full h-full object-cover" />
                          <div className="absolute top-2 left-2 bg-primary/80 backdrop-blur-md text-white text-[8px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">Solution Proof</div>
                        </div>
                      ) : (
                        <div className="aspect-square rounded-xl bg-surface flex flex-col items-center justify-center text-foreground-muted border border-dashed border-border">
                          <Clock className="w-6 h-6 mb-1 opacity-20" />
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Action Pending</span>
                        </div>
                      )}
                    </div>

                    {/* Action History */}
                    {reqAction && (
                      <div className="bg-primary/5 rounded-xl p-3 border border-primary/10 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 bg-primary text-white rounded-lg">
                            <Shield className="w-3.5 h-3.5" />
                          </div>
                          <p className="text-[11px] font-black uppercase tracking-wider text-primary">Municipal Update</p>
                        </div>
                        <p className="text-xs font-bold text-foreground leading-relaxed">{reqAction.action_taken}</p>
                        <p className="text-[10px] text-foreground-muted mt-2 font-medium">Updated by {reqAction.designation} · {formatDistanceToNow(new Date(reqAction.created_at), { addSuffix: true })}</p>
                      </div>
                    )}

                    {/* Municipal Update Form Toggle */}
                    {req.status !== 'installed' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsUpdating(isUpdating === req.id ? null : req.id); }}
                        className="w-full py-2.5 rounded-xl border border-border bg-surface-raised flex items-center justify-center gap-2 text-xs font-bold text-foreground hover:bg-border/30 transition-colors"
                      >
                        <AlertCircle className="w-4 h-4" /> Are you a Municipal Officer?
                      </button>
                    )}

                    {/* Update Form */}
                    {isUpdating === req.id && (
                      <div className="mt-4 p-4 rounded-xl border border-primary/20 bg-surface space-y-4 animate-slide-up">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-black uppercase tracking-widest text-primary">Submit Action Proof</h4>
                          <button onClick={() => setIsUpdating(null)} className="text-[10px] font-bold text-foreground-muted hover:text-foreground">CANCEL</button>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground-muted mb-1 block">Officer Designation</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Health Inspector, Ward Officer" 
                              className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-primary"
                              value={updateDesignation}
                              onChange={(e) => setUpdateDesignation(e.target.value)}
                            />
                          </div>
                          
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground-muted mb-1 block">Update Status</label>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setUpdateStatus('action_taken')}
                                className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all ${updateStatus === 'action_taken' ? 'bg-orange text-white border-orange shadow-subtle' : 'bg-white text-foreground-muted border-border'}`}
                              >
                                UNDER REVIEW
                              </button>
                              <button 
                                onClick={() => setUpdateStatus('installed')}
                                className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all ${updateStatus === 'installed' ? 'bg-primary text-white border-primary shadow-subtle' : 'bg-white text-foreground-muted border-border'}`}
                              >
                                INSTALLED
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground-muted mb-1 block">Upload Proof Photo</label>
                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-surface-raised transition-colors overflow-hidden relative">
                              {updateProof ? (
                                <>
                                  <img src={URL.createObjectURL(updateProof)} className="w-full h-full object-cover" alt="Preview" />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                    <Camera className="w-6 h-6 text-white" />
                                  </div>
                                </>
                              ) : (
                                <>
                                  <Camera className="w-6 h-6 text-foreground-muted mb-1" />
                                  <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">Tap to capture proof</span>
                                </>
                              )}
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => setUpdateProof(e.target.files?.[0] || null)} />
                            </label>
                          </div>

                          <button 
                            disabled={submitting || !updateProof}
                            onClick={() => handleUpdateAction(req.id)}
                            className="w-full bg-primary text-white py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
                          >
                            {submitting ? "Submitting..." : <><Send className="w-4 h-4" /> POST OFFICIAL UPDATE</>}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating Summary Bar */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-surface to-transparent pointer-events-none">
        <div className="max-w-lg mx-auto bg-foreground text-white p-3 rounded-2xl shadow-strong flex items-center justify-between pointer-events-auto ring-1 ring-white/10">
          <div className="flex items-center gap-4 px-2">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Total Data</span>
              <span className="text-sm font-black">{requests.length}</span>
            </div>
            <div className="w-[1px] h-6 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-orange">Pending</span>
              <span className="text-sm font-black">{requests.filter(r => r.status === 'requested').length}</span>
            </div>
            <div className="w-[1px] h-6 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-primary">Solved</span>
              <span className="text-sm font-black">{requests.filter(r => r.status === 'installed').length}</span>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="bg-white text-foreground px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all">
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
