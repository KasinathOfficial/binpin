import { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';
import { databases, client } from '../lib/appwrite';
import type { Feedback } from '../lib/appwrite';
import { Query } from 'appwrite';

const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const feedbackId = import.meta.env.VITE_APPWRITE_FEEDBACK_COLLECTION_ID;

interface FeedbackSheetProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function FeedbackSheet({ onClose, onSubmit }: FeedbackSheetProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [message, setMessage] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [activeTab, setActiveTab] = useState<'submit'|'feed'>('submit');

  useEffect(() => {
    if (dbId && feedbackId) {
      databases.listDocuments(dbId, feedbackId, [Query.orderDesc('$createdAt'), Query.limit(20)]).then(res => {
        setFeedbacks(res.documents.map(d => ({ ...d, id: d.$id, created_at: d.$createdAt })) as unknown as Feedback[]);
      });
      const sub = client.subscribe(`databases.${dbId}.collections.${feedbackId}.documents`, (response) => {
        if(response.events.includes("databases.*.collections.*.documents.*.create")) {
          const payload = response.payload as any;
          setFeedbacks(p => [{ ...payload, id: payload.$id, created_at: payload.$createdAt } as unknown as Feedback, ...p]);
        }
      });
      return () => sub();
    }
  }, []);

  const chips = [
    "Easy to use",
    "Helped me find a bin",
    "Missing bins in my area",
    "App is slow",
    "Love it!",
    "Other"
  ];

  const handleChipToggle = (chip: string) => {
    if (categories.includes(chip)) {
      setCategories(categories.filter(c => c !== chip));
    } else {
      setCategories([...categories, chip]);
    }
  };

  const handleSubmit = () => {
    onSubmit({ rating, message, categories });
  };

  return (
    <>
      <div 
        className="absolute inset-0 bg-black/40 z-[2000] backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className="absolute bottom-0 inset-x-0 bg-white z-[2001] rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex flex-col p-6 animate-slide-up pb-safe">
        
        {/* Handle */}
        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6 cursor-grab" onClick={onClose} />

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-muted rounded-full"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="flex gap-4 mb-6 justify-center">
          <button 
            className={`text-lg font-bold pb-1 border-b-2 transition-colors ${activeTab === 'submit' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}
            onClick={() => setActiveTab('submit')}
          >
            Review 💬
          </button>
          <button 
            className={`text-lg font-bold pb-1 border-b-2 transition-colors ${activeTab === 'feed' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}
            onClick={() => setActiveTab('feed')}
          >
            Community
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {activeTab === 'submit' ? (
            <>
              {/* Stars */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
              className="p-1 transition-transform active:scale-90"
            >
              <Star 
                className={`w-12 h-12 ${
                  (hoveredRating || rating) >= star 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'text-muted-foreground stroke-[1.5px]'
                } transition-all`} 
              />
            </button>
          ))}
        </div>

        {/* Categories */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {chips.map(chip => (
              <button
                key={chip}
                onClick={() => handleChipToggle(chip)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  categories.includes(chip)
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Text Area */}
        <div className="mb-8">
          <textarea 
            placeholder="Tell us more... (optional)" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-4 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
          />
        </div>

        <button 
          onClick={handleSubmit}
          disabled={rating === 0}
          className="w-full bg-primary hover:bg-green-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-soft mb-3"
        >
              Send Feedback
            </button>
            <p className="text-xs text-muted-foreground text-center mb-4">
              Anonymous · takes 10 seconds
            </p>
            </>
          ) : (
            <div className="space-y-4 pb-4">
              {feedbacks.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No feedback yet. Be the first!</p>
              ) : (
                feedbacks.map(f => (
                  <div key={f.id} className="bg-muted p-4 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                       <span className="flex text-yellow-400 gap-0.5">
                         {Array.from({length: 5}).map((_, i) => (
                           <Star key={i} className={`w-4 h-4 ${i < f.rating ? 'fill-yellow-400' : 'text-gray-300 fill-gray-300'}`} />
                         ))}
                       </span>
                       <span className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</span>
                    </div>
                    {f.message && <p className="text-sm font-medium mb-3">{f.message}</p>}
                    {f.categories && f.categories.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {f.categories.map(c => <span key={c} className="text-[10px] bg-white border px-2 py-0.5 rounded-full text-muted-foreground">{c}</span>)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
