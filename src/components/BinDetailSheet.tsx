import { useState, useEffect } from 'react';
import { Navigation, ThumbsUp, MessageSquare, AlertTriangle, Send, ImageOff, Share2 } from 'lucide-react';
import type { Bin, Comment } from '../lib/appwrite';
import { databases, client, ID } from '../lib/appwrite';
import { Query } from 'appwrite';
import BottomSheet from './ui/BottomSheet';
import { formatDistanceToNow } from 'date-fns';

const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const commentsId = import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID;

interface BinDetailSheetProps {
  bin: Bin;
  userLocation: [number, number] | null;
  onClose: () => void;
  onHelpful: () => void;
  onReport: () => void;
}

export default function BinDetailSheet({ bin, userLocation: _userLocation, onClose, onHelpful, onReport }: BinDetailSheetProps) {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  
  useEffect(() => {
    if (dbId && commentsId) {
      databases.listDocuments(dbId, commentsId, [Query.equal('bin_id', bin.id), Query.orderDesc('$createdAt')]).then(res => {
        setComments(res.documents.map(d => ({ ...d, id: d.$id, created_at: d.$createdAt })) as unknown as Comment[]);
      });
      
      const channel = `databases.${dbId}.collections.${commentsId}.documents`;
      const sub = client.subscribe(channel, (response) => {
          const payload = response.payload as any;
          if(payload.bin_id === bin.id && response.events.includes("databases.*.collections.*.documents.*.create")) {
            setComments(prev => [{ ...payload, id: payload.$id, created_at: payload.$createdAt } as unknown as Comment, ...prev]);
          }
      });
      return () => sub();
    }
  }, [bin.id]);
  
  const handleDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${bin.lat},${bin.lng}`;
    window.open(url, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `BinPin - ${bin.name}`,
          text: `Found a ${bin.type} dustbin around here. Use BinPin for zero-dark-data mapping!`,
          url: window.location.href
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      alert("Sharing not supported on this browser.");
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'organic': return 'bg-orange text-white';
      case 'medical': return 'bg-red text-white';
      case 'recyclable': return 'bg-blue text-white';
      default: return 'bg-primary text-white';
    }
  };

  return (
    <BottomSheet isOpen={true} onClose={onClose} height="65%">
      <div className="-mx-4 -mt-4 relative h-[180px] bg-surface-raised mb-4 shrink-0 overflow-hidden">
        {bin.photo_url ? (
          <img src={bin.photo_url} alt={bin.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-foreground-muted">
            <ImageOff className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-sm font-medium">No photo added</span>
          </div>
        )}
        
        <div className={`absolute bottom-3 left-4 px-3 py-1 flex items-center gap-1 rounded-sm text-xs font-semibold uppercase tracking-widest shadow-sm ${getBadgeColor(bin.type)}`}>
          {bin.type}
        </div>
        
        <div className="absolute bottom-3 right-4 px-3 py-1 bg-black/70 backdrop-blur-md text-white rounded-sm text-xs font-medium shadow-sm">
          · 120m
        </div>
        
        <button 
          onClick={handleShare}
          className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-md flex items-center justify-center rounded-full text-white hover:bg-black/60 transition-colors active:scale-95 shadow-sm"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="px-1">
        <h2 className="text-lg font-bold text-foreground mb-1">{bin.name}</h2>
        <p className="text-sm text-foreground-muted mb-2">Ward 12 · GHMC · Hyderabad</p>
        
        {bin.notes && (
          <p className="text-sm text-foreground-secondary italic mb-3">"{bin.notes}"</p>
        )}
        
        <p className="text-xs text-foreground-muted uppercase tracking-widest mb-4">
          Tagged anonymously · {bin.created_at ? formatDistanceToNow(new Date(bin.created_at), { addSuffix: true }) : 'Recently'}
        </p>
        
        <div className="h-px w-full bg-border border-0 mb-4" />

        <div className="flex items-center gap-2 mb-4">
          <button onClick={onHelpful} className="flex-1 bg-white border border-border h-[44px] rounded-md text-sm font-medium text-foreground hover:bg-surface-raised transition-colors flex items-center justify-center gap-1.5 active:scale-95 shadow-subtle">
            <ThumbsUp className="w-4 h-4 text-primary" />
            Helpful — {bin.upvote_count || 0}
          </button>
          <button className="flex-1 bg-white border border-border h-[44px] rounded-md text-sm font-medium text-foreground hover:bg-surface-raised transition-colors flex flex-wrap items-center justify-center gap-1.5 active:scale-95 shadow-subtle">
            <MessageSquare className="w-4 h-4 text-blue" />
            Comment — {comments.length}
          </button>
          <button onClick={onReport} className="flex-1 bg-white border border-border h-[44px] rounded-md text-sm font-medium text-red hover:bg-red-light transition-colors flex items-center justify-center gap-1.5 active:scale-95 shadow-subtle">
            <AlertTriangle className="w-4 h-4" />
            Report
          </button>
        </div>

        <button 
          onClick={handleDirections}
          className="w-full h-[48px] bg-primary hover:bg-primary/90 text-white font-medium rounded-md shadow-medium flex items-center justify-center gap-2 mb-6 active:scale-95 transition-all"
        >
          Get Walking Directions <Navigation className="w-4 h-4 ml-1" />
        </button>

        <div className="mb-4">
          <h3 className="text-xs font-medium uppercase tracking-widest text-foreground-muted mb-3">
            Community Notes
          </h3>
          
          <div className="space-y-3 mb-4">
            {comments.map((c, i) => (
              <div key={i} className="bg-surface p-3 rounded-md border border-border/50">
                <p className="text-sm text-foreground mb-2 leading-relaxed">{c.text}</p>
                <div className="text-xs text-foreground-muted text-right">
                  {c.created_at ? formatDistanceToNow(new Date(c.created_at), { addSuffix: true }) : 'Just now'}
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="text-sm text-foreground-muted text-center py-4 bg-surface rounded-md border border-dashed border-border">
                No notes added yet — be the first!
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Add a note..." 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 h-[44px] bg-white border border-border rounded-md px-3 text-sm outline-none focus:border-primary transition-colors min-w-0"
                maxLength={200}
              />
              <button 
                onClick={async () => {
                  if(commentText.trim() && dbId && commentsId) {
                    await databases.createDocument(dbId, commentsId, ID.unique(), { bin_id: bin.id, text: commentText });
                    setCommentText('');
                  }
                }}
                disabled={!commentText.trim()}
                className="w-[44px] h-[44px] bg-primary text-white rounded-md flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-foreground-muted text-center pt-1">Notes are anonymous and public</p>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
