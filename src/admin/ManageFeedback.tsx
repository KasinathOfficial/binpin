import { useState, useEffect } from 'react';
import { databases } from '../lib/appwrite';
import type { Feedback, Comment } from '../lib/appwrite';
import { Query } from 'appwrite';
import AdminLayout from './AdminLayout';
import { Trash2, MessageSquare, Heart, Star, Filter, Calendar } from 'lucide-react';

const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const feedbackId = import.meta.env.VITE_APPWRITE_FEEDBACK_COLLECTION_ID;
const commentsId = import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID;

export default function ManageFeedback() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feedback' | 'comments'>('feedback');
  
  const [filterRating, setFilterRating] = useState<string>('all');
  const [commentSearch, setCommentSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!dbId || !feedbackId || !commentsId) return;
    setLoading(true);
    try {
      const [fData, cData] = await Promise.all([
        databases.listDocuments(dbId, feedbackId, [Query.orderDesc('$createdAt'), Query.limit(100)]),
        databases.listDocuments(dbId, commentsId, [Query.orderDesc('$createdAt'), Query.limit(100)])
      ]);
      setFeedback(fData.documents.map(d => ({ ...d, id: d.$id, created_at: d.$createdAt })) as unknown as Feedback[]);
      setComments(cData.documents.map(d => ({ ...d, id: d.$id, created_at: d.$createdAt })) as unknown as Comment[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!dbId || !feedbackId) return;
    if (confirm('Permanently delete this feedback entry?')) {
      try {
        await databases.deleteDocument(dbId, feedbackId, id);
        fetchData();
      } catch (e) {
        alert('Action failed');
      }
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!dbId || !commentsId) return;
    if (confirm('Permanently delete this comment? Inappropriate posts should be removed.')) {
      try {
        await databases.deleteDocument(dbId, commentsId, id);
        fetchData();
      } catch (e) {
        alert('Action failed');
      }
    }
  };

  const filteredFeedback = feedback.filter(f => {
    if (filterRating === 'all') return true;
    return f.rating === parseInt(filterRating);
  });

  const filteredComments = comments.filter(c => 
    c.text.toLowerCase().includes(commentSearch.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Feedback & Moderation</h1>
          <p className="text-slate-400 mt-1">Review user ratings, global feedback, and moderate public comments</p>
        </div>
        
        {/* Toggle Tabs */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1">
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'feedback' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className="w-4 h-4" /> User Feedback ({feedback.length})
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'comments' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Comments ({comments.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
        </div>
      ) : activeTab === 'feedback' ? (
        <>
          {/* Feedback Controls */}
          <div className="flex justify-end mb-6">
            <div className="relative w-48">
              <Filter className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <select 
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-900 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary text-slate-300 appearance-none"
              >
                <option value="all">All Ratings</option>
                <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                <option value="4">⭐⭐⭐⭐ (4/5)</option>
                <option value="3">⭐⭐⭐ (3/5)</option>
                <option value="2">⭐⭐ (2/5)</option>
                <option value="1">⭐ (1/5)</option>
              </select>
            </div>
          </div>

          {/* Feedback Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFeedback.map(f => (
              <div key={f.id} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 relative group flex flex-col justify-between">
                <button 
                  onClick={() => handleDeleteFeedback(f.id)}
                  className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete Feedback"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < f.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
                    ))}
                  </div>

                  <p className="text-sm font-medium text-white mb-4 leading-relaxed">
                    {f.message || <span className="italic text-slate-500">No written message.</span>}
                  </p>
                </div>

                <div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {f.categories && f.categories.map(cat => (
                      <span key={cat} className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 font-medium">
                        {cat}
                      </span>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-800/50 flex justify-between items-center text-xs text-slate-500">
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">{f.device_type}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(f.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredFeedback.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-500">
                No feedback entries match your criteria.
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Comment Search */}
          <div className="mb-6 max-w-md">
            <input 
              type="text" 
              placeholder="Filter comments by text..." 
              value={commentSearch}
              onChange={(e) => setCommentSearch(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary text-white text-sm"
            />
          </div>

          {/* Comments Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Comment Body</th>
                    <th className="px-6 py-4">Bin ID</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredComments.map(c => (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-white max-w-lg break-words">
                        {c.text}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">
                        {c.bin_id}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteComment(c.id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Delete Comment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredComments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                        No public comments recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
