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
          <h1 className="text-3xl font-bold">Manage Bins</h1>
          <p className="text-slate-400 mt-1">Audit, edit, or delete public bin locations</p>
        </div>
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
          <span className="px-3 py-1 bg-primary/20 text-primary font-bold rounded-lg border border-primary/20">{bins.length} Total</span>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative md:col-span-2">
          <Search className="w-5 h-5 absolute left-3 top-3.5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by name or notes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary text-white"
          />
        </div>
        
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-4 text-slate-500" />
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full pl-9 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary text-slate-300 appearance-none"
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
            className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary text-slate-300 appearance-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="deleted">Soft Deleted Only</option>
          </select>
        </div>
      </div>

      {/* Modal Edit */}
      {editingBin && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Edit Bin Details</h3>
            <form onSubmit={handleUpdateBin} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400">Bin Name</label>
                <input 
                  type="text" 
                  value={editingBin.name} 
                  onChange={e => setEditingBin({...editingBin, name: e.target.value})}
                  className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Bin Type</label>
                <select 
                  value={editingBin.type} 
                  onChange={e => setEditingBin({...editingBin, type: e.target.value as any})}
                  className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="general">General</option>
                  <option value="recyclable">Recyclable</option>
                  <option value="organic">Organic</option>
                  <option value="medical">Medical</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400">Notes/Address</label>
                <textarea 
                  value={editingBin.notes || ''} 
                  onChange={e => setEditingBin({...editingBin, notes: e.target.value})}
                  className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary h-24"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Upvotes</label>
                <input 
                  type="number" 
                  value={editingBin.upvote_count} 
                  onChange={e => setEditingBin({...editingBin, upvote_count: parseInt(e.target.value) || 0})}
                  className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-semibold transition-all"
                >
                  Save Changes
                </button>
                <button 
                  type="button"
                  onClick={() => setEditingBin(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl transition-all"
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
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Reports</th>
                  <th className="px-6 py-4">Upvotes</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredBins.map(bin => (
                  <tr key={bin.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit ${
                        bin.is_deleted 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${bin.is_deleted ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                        {bin.is_deleted ? 'Soft Deleted' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <div className="flex flex-col">
                        <span>{bin.name}</span>
                        {bin.notes && <span className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{bin.notes}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="uppercase text-[10px] tracking-wider bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                        {bin.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {bin.report_count > 0 ? (
                        <span className="flex items-center gap-1 text-amber-500 font-bold">
                          <AlertTriangle className="w-4 h-4" />
                          {bin.report_count}
                        </span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-semibold">{bin.upvote_count}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setEditingBin(bin)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleSoftDelete(bin.id, bin.is_deleted)}
                          className={`p-2 rounded-lg transition-colors ${
                            bin.is_deleted 
                              ? 'text-emerald-500 hover:bg-emerald-500/10' 
                              : 'text-amber-500 hover:bg-amber-500/10'
                          }`}
                          title={bin.is_deleted ? "Restore" : "Soft Delete"}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleHardDelete(bin.id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
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
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
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
