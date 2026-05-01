import { useState, useEffect, useRef } from 'react';
import { Navigation, ThumbsUp, MessageSquare, AlertTriangle, Send, ImageOff, Share2, MapPin } from 'lucide-react';
import type { Bin, Comment } from '../lib/appwrite';
import { databases, client, ID } from '../lib/appwrite';
import { Query } from 'appwrite';
import BottomSheet from './ui/BottomSheet';
import { formatDistanceToNow } from 'date-fns';
import { getDistance, formatDistance } from '../lib/geo';

const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const commentsId = import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID;

interface BinDetailSheetProps {
  bin: Bin;
  userLocation: [number, number] | null;
  onClose: () => void;
  onHelpful: () => void;
  onReport: () => void;
}

export default function BinDetailSheet({ bin, userLocation, onClose, onHelpful, onReport }: BinDetailSheetProps) {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);
  const commentSectionRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Calculate real distance
  const distanceMeters = userLocation
    ? getDistance(userLocation[0], userLocation[1], bin.lat, bin.lng)
    : null;
  const distanceLabel = distanceMeters !== null ? formatDistance(distanceMeters) : null;

  useEffect(() => {
    if (dbId && commentsId) {
      databases.listDocuments(dbId, commentsId, [Query.equal('bin_id', bin.id), Query.orderDesc('$createdAt')]).then(res => {
        setComments(res.documents.map(d => ({ ...d, id: d.$id, created_at: d.$createdAt })) as unknown as Comment[]);
      });

      const channel = `databases.${dbId}.collections.${commentsId}.documents`;
      const sub = client.subscribe(channel, (response) => {
        const payload = response.payload as any;
        if (payload.bin_id === bin.id && response.events.includes("databases.*.collections.*.documents.*.create")) {
          setComments(prev => [{ ...payload, id: payload.$id, created_at: payload.$createdAt } as unknown as Comment, ...prev]);
        }
      });
      return () => sub();
    }
  }, [bin.id]);

  const handleDirections = () => {
    // Use Google Maps navigation with GPS-based routing to the bin
    const url = `https://www.google.com/maps/dir/?api=1&destination=${bin.lat},${bin.lng}&travelmode=walking`;
    window.open(url, '_blank');
  };

  const handleAppleMaps = () => {
    // Apple Maps for iOS users
    const url = `maps://maps.apple.com/?daddr=${bin.lat},${bin.lng}&dirflg=w`;
    window.open(url, '_blank');
  };

  const handleShare = async () => {
    const shareData = {
      title: `BinPin – ${bin.name}`,
      text: `Found a ${bin.type} dustbin here! Use BinPin to find bins near you.`,
      url: `https://binpin.vercel.app/?bin=${bin.id}`
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copied to clipboard!');
      } catch {
        alert("Sharing not supported on this browser.");
      }
    }
  };

  const scrollToComments = () => {
    commentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => commentInputRef.current?.focus(), 400);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !dbId || !commentsId) return;
    setIsSubmittingComment(true);
    try {
      await databases.createDocument(dbId, commentsId, ID.unique(), {
        bin_id: bin.id,
        text: commentText.trim()
      });
      setCommentText('');
      setCommentSuccess(true);
      setTimeout(() => setCommentSuccess(false), 2500);
    } catch (e) {
      console.error('Failed to post comment', e);
      alert('Failed to post comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'organic':    return 'bg-amber-500 text-white';
      case 'medical':    return 'bg-red-500 text-white';
      case 'recyclable': return 'bg-blue-500 text-white';
      default:           return 'bg-emerald-600 text-white';
    }
  };

  // Determine city label from bin data
  const cityLabel = (bin as any).city || null;

  return (
    <BottomSheet isOpen={true} onClose={onClose} height="72%">
      {/* Photo Hero */}
      <div className="-mx-4 -mt-4 relative h-[180px] bg-surface-raised mb-4 shrink-0 overflow-hidden">
        {bin.photo_url ? (
          <img src={bin.photo_url} alt={bin.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-foreground-muted bg-gradient-to-br from-emerald-50 to-green-100">
            <ImageOff className="w-8 h-8 mb-2 opacity-40 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">No photo added</span>
          </div>
        )}

        {/* Type badge */}
        <div className={`absolute bottom-3 left-4 px-3 py-1 flex items-center gap-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${getBadgeColor(bin.type)}`}>
          {bin.type}
        </div>

        {/* Distance badge */}
        {distanceLabel && (
          <div className="absolute bottom-3 right-14 px-3 py-1 bg-black/70 backdrop-blur-md text-white rounded-full text-xs font-semibold shadow-sm flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {distanceLabel}
          </div>
        )}

        {/* Share button */}
        <button
          onClick={handleShare}
          className="absolute top-4 right-4 w-9 h-9 bg-black/40 backdrop-blur-md flex items-center justify-center rounded-full text-white hover:bg-black/60 transition-colors active:scale-95 shadow-sm"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      <div className="px-1">
        {/* Title + location */}
        <h2 className="text-lg font-bold text-foreground mb-0.5">{bin.name}</h2>
        {cityLabel && (
          <p className="text-sm text-foreground-muted mb-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 inline" /> {cityLabel}
          </p>
        )}

        {bin.notes && (
          <p className="text-sm text-foreground-secondary italic mb-3">"{bin.notes}"</p>
        )}

        <p className="text-xs text-foreground-muted uppercase tracking-widest mb-4">
          Tagged anonymously · {bin.created_at ? formatDistanceToNow(new Date(bin.created_at), { addSuffix: true }) : 'Recently'}
        </p>

        <div className="h-px w-full bg-border border-0 mb-4" />

        {/* Action buttons */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={onHelpful}
            className="flex-1 bg-white border border-border h-[44px] rounded-xl text-sm font-medium text-foreground hover:bg-emerald-50 hover:border-emerald-200 transition-colors flex items-center justify-center gap-1.5 active:scale-95 shadow-subtle"
          >
            <ThumbsUp className="w-4 h-4 text-primary" />
            Helpful — {bin.upvote_count || 0}
          </button>
          <button
            onClick={scrollToComments}
            className="flex-1 bg-white border border-border h-[44px] rounded-xl text-sm font-medium text-foreground hover:bg-blue-50 hover:border-blue-200 transition-colors flex items-center justify-center gap-1.5 active:scale-95 shadow-subtle"
          >
            <MessageSquare className="w-4 h-4 text-blue-500" />
            Comment — {comments.length}
          </button>
          <button
            onClick={onReport}
            className="flex-1 bg-white border border-border h-[44px] rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors flex items-center justify-center gap-1.5 active:scale-95 shadow-subtle"
          >
            <AlertTriangle className="w-4 h-4" />
            Report
          </button>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={handleDirections}
            className="flex-1 h-[52px] bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-medium flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Navigation className="w-4 h-4" /> Get Route
          </button>
          {/* Apple Maps fallback for iOS */}
          <button
            onClick={handleAppleMaps}
            className="h-[52px] px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-medium flex items-center justify-center gap-2 active:scale-95 transition-all text-xs"
            title="Open in Apple Maps"
          >
            🍎 Maps
          </button>
        </div>

        {/* Comments Section */}
        <div className="mb-4" ref={commentSectionRef}>
          <h3 className="text-xs font-bold uppercase tracking-widest text-foreground-muted mb-3 flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5" /> Community Notes ({comments.length})
          </h3>

          <div className="space-y-3 mb-4">
            {comments.map((c, i) => (
              <div key={i} className="bg-surface p-3 rounded-xl border border-border/50">
                <p className="text-sm text-foreground mb-2 leading-relaxed">{c.text}</p>
                <div className="text-xs text-foreground-muted text-right">
                  {c.created_at ? formatDistanceToNow(new Date(c.created_at), { addSuffix: true }) : 'Just now'}
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="text-sm text-foreground-muted text-center py-5 bg-surface rounded-xl border border-dashed border-border">
                No notes yet — be the first! 👇
              </div>
            )}
          </div>

          {/* Comment Input */}
          <div className="flex flex-col gap-2">
            {commentSuccess && (
              <div className="text-xs text-emerald-600 font-bold text-center bg-emerald-50 border border-emerald-200 rounded-lg py-2">
                ✓ Comment posted! Thank you.
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={commentInputRef}
                type="text"
                placeholder="Add a note about this bin..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitComment(); }}
                className="flex-1 h-[44px] bg-white border border-border rounded-xl px-3 text-sm outline-none focus:border-primary transition-colors min-w-0"
                maxLength={200}
              />
              <button
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || isSubmittingComment}
                className="w-[44px] h-[44px] bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {isSubmittingComment
                  ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </button>
            </div>
            <p className="text-xs text-foreground-muted text-center">Notes are anonymous and public</p>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
