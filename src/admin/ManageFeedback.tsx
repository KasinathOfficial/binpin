import { useState, useEffect } from 'react';
import { databases } from '../lib/appwrite';
import type { Feedback } from '../lib/appwrite';
import { Query } from 'appwrite';
import AdminLayout from './AdminLayout';
import { Trash2, Heart, Star, Filter, Calendar } from 'lucide-react';

const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const feedbackId = import.meta.env.VITE_APPWRITE_FEEDBACK_COLLECTION_ID;

export default function ManageFeedback() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterRating, setFilterRating] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!dbId || !feedbackId) return;
    setLoading(true);
    try {
      const fData = await databases.listDocuments(dbId, feedbackId, [Query.orderDesc('$createdAt'), Query.limit(100)]);
      setFeedback(fData.documents.map(d => ({ ...d, id: d.$id, created_at: d.$createdAt })) as unknown as Feedback[]);
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

  const filteredFeedback = feedback.filter(f => {
    if (filterRating === 'all') return true;
    return f.rating === parseInt(filterRating);
  });

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">App Feedback</h1>
          <p className="text-foreground-secondary mt-1 font-medium">Review user ratings and global feedback about the platform</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl border border-border shadow-sm flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary fill-primary" />
            <span className="text-xs font-bold text-foreground">{feedback.length} Submissions</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Feedback Controls */}
          <div className="flex justify-end mb-6">
            <div className="relative w-48">
              <Filter className="w-4 h-4 absolute left-3 top-3 text-foreground-muted" />
              <select 
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs font-bold bg-white border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/10 text-foreground appearance-none shadow-sm"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
          </div>

          {/* Feedback Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFeedback.map(f => (
              <div key={f.id} className="bg-white border border-border rounded-2xl p-6 relative group flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                <button 
                  onClick={() => handleDeleteFeedback(f.id)}
                  className="absolute top-4 right-4 p-2 text-foreground-muted hover:text-red hover:bg-red-light rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-red/10"
                  title="Delete Feedback"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div>
                  <div className="flex items-center gap-1 text-orange mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < f.rating ? 'fill-orange text-orange' : 'text-border-strong'}`} />
                    ))}
                  </div>

                  <p className="text-sm font-bold text-foreground mb-6 leading-relaxed">
                    {f.message || <span className="italic text-foreground-muted font-medium">No written message.</span>}
                  </p>
                </div>

                <div>
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {f.categories && f.categories.map(cat => (
                      <span key={cat} className="text-[10px] bg-surface text-foreground-secondary px-2.5 py-1 rounded-lg border border-border font-bold uppercase tracking-wider">
                        {cat}
                      </span>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-border flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-foreground-muted">
                    <span className="bg-primary text-white px-2 py-0.5 rounded shadow-sm">{f.device_type}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(f.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredFeedback.length === 0 && (
              <div className="col-span-full py-16 text-center text-foreground-muted font-bold uppercase tracking-widest text-xs">
                No feedback entries found.
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
