import { useState, useEffect } from 'react';
import { databases } from '../lib/appwrite';
import type { Bin } from '../lib/appwrite';
import { Query } from 'appwrite';
import AdminLayout from './AdminLayout';
import { Search, Trash2, Edit2, CheckCircle, AlertTriangle, Filter } from 'lucide-react';

const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const binsId = import.meta.env.VITE_APPWRITE_BINS_COLLECTION_ID;

export default function ManageBins() {
  const [bins, setBins] = useState<Bin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingBin, setEditingBin] = useState<Bin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBins();
  }, []);

  const fetchBins = async () => {
    if (!dbId || !binsId) return;
    setLoading(true);
    try {
      const response = await databases.listDocuments(dbId, binsId, [
        Query.orderDesc('$createdAt'),
        Query.limit(100)
      ]);
      setBins(response.documents.map(d => ({ ...d, id: d.$id, created_at: d.$createdAt })) as unknown as Bin[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSoftDelete = async (id: string, currentStatus: boolean) => {
    if (!dbId || !binsId) return;
    if (confirm(`Are you sure you want to ${currentStatus ? 'restore' : 'soft delete'} this bin?`)) {
      try {
        await databases.updateDocument(dbId, binsId, id, { is_deleted: !currentStatus });
        fetchBins();
      } catch (e) {
        alert('Action failed');
      }
    }
  };

  const handleHardDelete = async (id: string) => {
    if (!dbId || !binsId) return;
    if (confirm('Permanently delete this bin from the database? This cannot be undone.')) {
      try {
        await databases.deleteDocument(dbId, binsId, id);
        fetchBins();
      } catch (e) {
        alert('Action failed');
      }
    }
  };

  const handleUpdateBin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbId || !binsId || !editingBin) return;
    
    try {
      await databases.updateDocument(dbId, binsId, editingBin.id, {
        name: editingBin.name,
        type: editingBin.type,
        notes: editingBin.notes,
        upvote_count: editingBin.upvote_count,
      });
      setEditingBin(null);
      fetchBins();
    } catch (e) {
      alert('Update failed');
    }
  };

  const filteredBins = bins.filter(bin => {
    const matchesSearch = bin.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (bin.notes && bin.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || bin.type === filterType;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && !bin.is_deleted) || 
                         (filterStatus === 'deleted' && bin.is_deleted);
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manage Bins</h1>
          <p className="text-slate-500 mt-1">Audit, edit, or delete public bin locations</p>
        </div>
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 text-xs">
          <span className="px-3 py-1 bg-slate-900 text-white font-bold rounded-lg">{bins.length} Total</span>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative md:col-span-2">
          <Search className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name or notes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 text-slate-900"
          />
        </div>
        
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-4 text-slate-400" />
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 text-slate-700 appearance-none"
          >
            <option value="all">All Types</option>
            <option value="general">General</option>
            <option value="recyclable">Recyclable</option>
            <option value="organic">Organic</option>
            <option value="medical">Medical</option>
          </select>
        </div>

        <div className="relative">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 text-slate-700 appearance-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="deleted">Soft Deleted Only</option>
          </select>
        </div>
      </div>

      {/* Modal Edit */}
      {editingBin && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-slate-900">Edit Bin Details</h3>
            <form onSubmit={handleUpdateBin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bin Name</label>
                <input 
                  type="text" 
                  value={editingBin.name} 
                  onChange={e => setEditingBin({...editingBin, name: e.target.value})}
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bin Type</label>
                <select 
                  value={editingBin.type} 
                  onChange={e => setEditingBin({...editingBin, type: e.target.value as any})}
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-slate-900"
                >
                  <option value="general">General</option>
                  <option value="recyclable">Recyclable</option>
                  <option value="organic">Organic</option>
                  <option value="medical">Medical</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes/Address</label>
                <textarea 
                  value={editingBin.notes || ''} 
                  onChange={e => setEditingBin({...editingBin, notes: e.target.value})}
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-slate-900 h-24"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upvotes</label>
                <input 
                  type="number" 
                  value={editingBin.upvote_count} 
                  onChange={e => setEditingBin({...editingBin, upvote_count: parseInt(e.target.value) || 0})}
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-slate-900/10"
                >
                  Save Changes
                </button>
                <button 
                  type="button"
                  onClick={() => setEditingBin(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-slate-900"></div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Reports</th>
                  <th className="px-6 py-4">Upvotes</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBins.map(bin => (
                  <tr key={bin.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit ${
                        bin.is_deleted 
                          ? 'bg-red-50 text-red-600 border border-red-100' 
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${bin.is_deleted ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                        {bin.is_deleted ? 'Deleted' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{bin.name}</span>
                        {bin.notes && <span className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">{bin.notes}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="uppercase text-[10px] tracking-widest font-black text-slate-400">
                        {bin.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {bin.report_count > 0 ? (
                        <span className="flex items-center gap-1 text-red-600 font-bold">
                          <AlertTriangle className="w-4 h-4" />
                          {bin.report_count}
                        </span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-bold">{bin.upvote_count}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setEditingBin(bin)}
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleSoftDelete(bin.id, bin.is_deleted)}
                          className={`p-2 rounded-lg transition-all border border-transparent ${
                            bin.is_deleted 
                              ? 'text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100' 
                              : 'text-amber-600 hover:bg-amber-50 hover:border-amber-100'
                          }`}
                          title={bin.is_deleted ? "Restore" : "Soft Delete"}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleHardDelete(bin.id)}
                          className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 hover:border-red-100 rounded-lg transition-all border border-transparent"
                          title="Hard Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBins.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No bins found matching filters.
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
