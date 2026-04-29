import { useState, useEffect } from 'react';
import { databases, storage, ID } from '../lib/appwrite';
import type { BinRequest } from '../lib/appwrite';
import { Query } from 'appwrite';
import AdminLayout from './AdminLayout';
import { Search, CheckCircle, Clock, AlertCircle, Trash2, ChevronDown, Check, Eye } from 'lucide-react';

const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const requestsId = import.meta.env.VITE_APPWRITE_REQUESTS_COLLECTION_ID;
const actionsId = import.meta.env.VITE_APPWRITE_ACTIONS_COLLECTION_ID;
const bucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID;

export default function ManageRequests() {
  const [requests, setRequests] = useState<BinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // For action submission
  const [selectedRequest, setSelectedRequest] = useState<BinRequest | null>(null);
  const [designation, setDesignation] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    if (!dbId || !requestsId) return;
    setLoading(true);
    try {
      const response = await databases.listDocuments(dbId, requestsId, [
        Query.orderDesc('$createdAt'),
        Query.limit(100)
      ]);
      setRequests(response.documents.map(d => ({ ...d, id: d.$id, created_at: d.$createdAt })) as unknown as BinRequest[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, status: 'requested' | 'under_review' | 'action_taken' | 'installed') => {
    if (!dbId || !requestsId) return;
    try {
      await databases.updateDocument(dbId, requestsId, requestId, { status });
      fetchRequests();
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!dbId || !requestsId) return;
    if (confirm('Permanently delete this request?')) {
      try {
        await databases.deleteDocument(dbId, requestsId, requestId);
        fetchRequests();
      } catch (e) {
        alert('Failed to delete request');
      }
    }
  };

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbId || !actionsId || !selectedRequest) return;
    setSubmittingAction(true);

    try {
      let proof_url = '';
      if (proofFile && bucketId) {
        const upload = await storage.createFile(bucketId, ID.unique(), proofFile);
        proof_url = storage.getFileView(bucketId, upload.$id).toString();
      }

      // 1. Create Municipal Action
      await databases.createDocument(dbId, actionsId, ID.unique(), {
        request_id: selectedRequest.id,
        designation,
        action_taken: actionTaken,
        proof_url: proof_url || null,
      });

      // 2. Update status of request to 'action_taken' or 'installed'
      const newStatus = actionTaken.toLowerCase().includes('install') ? 'installed' : 'action_taken';
      await databases.updateDocument(dbId, requestsId, selectedRequest.id, { 
        status: newStatus 
      });

      alert('Municipal response logged successfully!');
      setSelectedRequest(null);
      setDesignation('');
      setActionTaken('');
      setProofFile(null);
      fetchRequests();
    } catch (err) {
      alert('Failed to create action record');
    } finally {
      setSubmittingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'installed':
        return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-full flex items-center gap-1 w-fit"><CheckCircle className="w-3.5 h-3.5" /> Installed</span>;
      case 'action_taken':
        return <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold rounded-full flex items-center gap-1 w-fit"><Check className="w-3.5 h-3.5" /> Action Logged</span>;
      case 'under_review':
        return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold rounded-full flex items-center gap-1 w-fit"><Clock className="w-3.5 h-3.5" /> Under Review</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-500/10 text-slate-400 border border-slate-500/20 text-xs font-semibold rounded-full flex items-center gap-1 w-fit"><AlertCircle className="w-3.5 h-3.5" /> Requested</span>;
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.address?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         req.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Bin Requests</h1>
          <p className="text-slate-400 mt-1">Review deployment requests and track municipal accountability</p>
        </div>
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
          <span className="px-3 py-1 bg-primary/20 text-primary font-bold rounded-lg border border-primary/20">{requests.length} Total</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative md:col-span-2">
          <Search className="w-5 h-5 absolute left-3 top-3.5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search address, city, description..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary text-white"
          />
        </div>

        <div className="relative">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary text-slate-300 appearance-none"
          >
            <option value="all">All Request Statuses</option>
            <option value="requested">Requested</option>
            <option value="under_review">Under Review</option>
            <option value="action_taken">Action Taken</option>
            <option value="installed">Installed</option>
          </select>
        </div>
      </div>

      {/* Municipal Response Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Municipal Response</h3>
            <p className="text-slate-400 text-xs mb-4">Log action for: <span className="text-slate-300 font-semibold">{selectedRequest.address || 'Unnamed Location'}</span></p>
            
            <form onSubmit={handleSubmitAction} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 tracking-wider">MUNICIPAL DESIGNATION / DEPARTMENT</label>
                <input 
                  type="text" 
                  value={designation} 
                  onChange={e => setDesignation(e.target.value)}
                  placeholder="e.g. City Sanitation Dept."
                  className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 tracking-wider">ACTION TAKEN</label>
                <textarea 
                  value={actionTaken} 
                  onChange={e => setActionTaken(e.target.value)}
                  placeholder="Describe details of site check or deployment..."
                  className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary h-24"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 tracking-wider">PROOF IMAGE (OPTIONAL)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => setProofFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full mt-1 text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="submit"
                  disabled={submittingAction}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {submittingAction ? 'Submitting...' : 'Submit Action'}
                </button>
                <button 
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Location/City</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Upvotes</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{req.address || 'Unknown'}</span>
                        <span className="text-xs text-slate-500 mt-0.5">{req.city || 'No City'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 max-w-xs truncate">
                      {req.description}
                    </td>
                    <td className="px-6 py-4 font-bold text-primary">{req.upvote_count}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {req.photo_url && (
                          <a 
                            href={req.photo_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="View Photo"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        
                        <div className="relative group">
                          <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-xl w-40 invisible group-hover:visible transition-all z-10 p-1 text-left">
                            <button onClick={() => handleUpdateStatus(req.id, 'requested')} className="w-full text-xs text-slate-300 hover:text-white hover:bg-slate-800 p-2 rounded-lg text-left">Set Requested</button>
                            <button onClick={() => handleUpdateStatus(req.id, 'under_review')} className="w-full text-xs text-slate-300 hover:text-white hover:bg-slate-800 p-2 rounded-lg text-left">Set Under Review</button>
                            <button onClick={() => setSelectedRequest(req)} className="w-full text-xs text-primary hover:bg-primary/10 p-2 rounded-lg text-left font-semibold">Log Action</button>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleDeleteRequest(req.id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Delete Request"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                      No requests found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
