import { useState, useEffect, useRef } from 'react';
import { Navigation, ThumbsUp, MessageSquare, AlertTriangle, Send, ImageOff, Share2, MapPin, Edit3, X, CheckCircle2 } from 'lucide-react';
import type { Bin, Comment } from '../lib/appwrite';
import { databases, client, ID } from '../lib/appwrite';
import { Query } from 'appwrite';
import BottomSheet from './ui/BottomSheet';
import { formatDistanceToNow } from 'date-fns';
import { getDistance, formatDistance } from '../lib/geo';
import { hasUpvotedBin, addUpvotedBin } from '../lib/votes';

const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const commentsId = import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID;

interface BinDetailSheetProps {
  bin: Bin;
  userLocation: [number, number] | null;
  onClose: () => void;
  onHelpful: () => void;
  onReport: (reason: string) => void;
  onSuggestEdit?: () => void;
}

export default function BinDetailSheet({ 
  bin, 
  userLocation, 
  onClose, 
  onHelpful, 
  onReport,
  onSuggestEdit 
}: BinDetailSheetProps) {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);
  
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [voted, setVoted] = useState(false);

  const commentSectionRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setVoted(hasUpvotedBin(bin.id));
  }, [bin.id]);

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

  const handleHelpful = () => {
    if (voted) return;
    addUpvotedBin(bin.id);
    setVoted(true);
    onHelpful();
  };

  const handleReportSubmit = () => {
    if (!reportReason.trim()) return;
    onReport(reportReason.trim());
    setIsReporting(false);
    setReportReason('');
  };

  const handleDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${bin.lat},${bin.lng}&travelmode=walking`;
    window.open(url, '_blank');
  };

  const handleAppleMaps = () => {
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

  const cityLabel = (bin as any).city || null;

  return (
    <BottomSheet isOpen={true} onClose={onClose} height="78%">
      {/* Photo Hero */}
      <div className="-mx-4 -mt-4 relative h-[180px] bg-surface-raised mb-4 shrink-0 overflow-hidden">
        {bin.photo_url ? (
          <img src={bin.photo_url} alt={bin.name} className="w-full h-full object-contain bg-black/5" />
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
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <h2 className="text-lg font-bold text-foreground">{bin.name}</h2>
            {cityLabel && (
              <p className="text-sm text-foreground-muted flex items-center gap-1">
                <MapPin className="w-3 h-3 inline" /> {cityLabel}
              </p>
            )}
          </div>
          <button 
            onClick={onSuggestEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface rounded-lg text-[11px] font-bold text-foreground-secondary border border-border hover:text-primary hover:border-primary transition-all active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5" /> Suggest Edit
          </button>
        </div>

        {bin.notes && (
          <p className="text-sm text-foreground-secondary italic mb-3">"{bin.notes}"</p>
        )}

        <p className="text-xs text-foreground-muted uppercase tracking-widest mb-4">
          Tagged anonymously · {(() => {
            try {
              if (!bin.created_at) return 'Recently';
              const date = new Date(bin.created_at);
              if (isNaN(date.getTime())) return 'Recently';
              return formatDistanceToNow(date, { addSuffix: true });
            } catch (e) {
              return 'Recently';
            }
          })()}
        </p>

        <div className="h-px w-full bg-border border-0 mb-4" />

        {/* Action buttons */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={handleHelpful}
            disabled={voted}
            className={`flex-1 border h-[44px] rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5 active:scale-95 shadow-subtle ${
              voted 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
              : 'bg-white border-border text-foreground hover:bg-emerald-50 hover:border-emerald-200'
            }`}
          >
            {voted ? <CheckCircle2 className="w-4 h-4" /> : <ThumbsUp className="w-4 h-4 text-primary" />}
            {voted ? 'Voted Helpful' : `Helpful — ${bin.upvote_count || 0}`}
          </button>
          <button
            onClick={scrollToComments}
            className="flex-1 bg-white border border-border h-[44px] rounded-xl text-sm font-medium text-foreground hover:bg-blue-50 hover:border-blue-200 transition-colors flex items-center justify-center gap-1.5 active:scale-95 shadow-subtle"
          >
            <MessageSquare className="w-4 h-4 text-blue-500" />
            Comment — {comments.length}
          </button>
          <button
            onClick={() => setIsReporting(true)}
            className="flex-1 bg-white border border-border h-[44px] rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors flex items-center justify-center gap-1.5 active:scale-95 shadow-subtle"
          >
            <AlertTriangle className="w-4 h-4" />
            Report
          </button>
        </div>

        {/* Report Reason Input (Conditional) */}
        {isReporting && (
          <div className="mb-4 animate-slide-up">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-red-600">Why are you reporting?</h4>
                <button onClick={() => setIsReporting(false)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
              </div>
              <textarea
                autoFocus
                placeholder="e.g. Bin is missing, wrong location, or full..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full p-3 bg-white border border-red-200 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-red-100 h-20 resize-none mb-3"
              />
              <button 
                onClick={handleReportSubmit}
                disabled={!reportReason.trim()}
                className="w-full bg-red-600 text-white font-bold py-2 rounded-lg text-sm disabled:opacity-50 transition-all active:scale-95 shadow-md shadow-red-200"
              >
                Submit Report
              </button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={handleDirections}
            className="flex-1 h-[52px] bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-medium flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Navigation className="w-4 h-4" /> Get Route
          </button>
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
                  {(() => {
                    try {
                      if (!c.created_at) return 'Just now';
                      const date = new Date(c.created_at);
                      if (isNaN(date.getTime())) return 'Just now';
                      return formatDistanceToNow(date, { addSuffix: true });
                    } catch (e) {
                      return 'Just now';
                    }
                  })()}
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
