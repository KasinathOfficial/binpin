import { ThumbsUp, MapPin, Building, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { BinRequest } from '../lib/appwrite';
import BottomSheet from './ui/BottomSheet';
import { formatDistanceToNow } from 'date-fns';

interface RequestDetailSheetProps {
  request: BinRequest;
  onClose: () => void;
  onUpvote: () => void;
  onMunicipalAction?: () => void;
}

export default function RequestDetailSheet({ request, onClose, onUpvote, onMunicipalAction }: RequestDetailSheetProps) {
  const statuses = ['requested', 'under_review', 'action_taken', 'installed'];
  const currentStatusIndex = statuses.indexOf(request.status);

  return (
    <BottomSheet isOpen={true} onClose={onClose} height="80%" title="Public Bin Request" accentBorder>
      <div className="flex flex-col h-full -mx-4 px-4 overflow-y-auto hide-scrollbar">
        
        {/* Status Timeline */}
        <div className="bg-surface p-4 rounded-xl shadow-subtle mb-6 mt-2 border border-border">
          <p className="text-[11px] font-bold uppercase tracking-widest text-foreground-muted mb-4">Request Status</p>
          <div className="relative flex justify-between">
            <div className="absolute top-3 inset-x-4 h-[2px] bg-border-strong -z-10" />
            <div className="absolute top-3 left-4 h-[2px] bg-orange transition-all duration-500 -z-10" style={{ width: ((currentStatusIndex / 3) * 100) + '%' }} />
            
            {[
              { id: 'requested', label: 'Requested', icon: AlertCircle },
              { id: 'under_review', label: 'Reviewed', icon: Clock },
              { id: 'action_taken', label: 'Action', icon: Building },
              { id: 'installed', label: 'Installed', icon: CheckCircle2 }
            ].map((s, i) => {
              const active = i <= currentStatusIndex;
              const Icon = s.icon;
              return (
                <div key={s.id} className="flex flex-col items-center gap-2 bg-surface px-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${active ? 'border-orange bg-orange text-white' : 'border-border-strong bg-white text-border-strong'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[10px] font-bold uppercase transition-colors ${active ? 'text-orange' : 'text-foreground-muted'}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-orange" />
            <h2 className="text-xl font-bold text-foreground">{request.city || 'Unknown Location'}</h2>
          </div>
          <p className="text-xs text-foreground-muted uppercase tracking-widest mb-4">
            Opened {request.created_at ? formatDistanceToNow(new Date(request.created_at), { addSuffix: true }) : 'Recently'}
          </p>

          <div className="p-4 bg-orange-light/50 border border-orange/20 rounded-xl mb-4">
            <p className="text-sm text-foreground font-medium italic leading-relaxed">
              "{request.description}"
            </p>
          </div>

          {request.photo_url && (
            <div className="w-full h-40 rounded-xl overflow-hidden shadow-subtle mb-4">
              <img src={request.photo_url} alt="Problem Area" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Escalate / Upvote */}
        <button 
          onClick={onUpvote}
          className="w-full bg-white border-[2px] border-orange hover:bg-orange-light text-orange font-bold py-4 rounded-xl shadow-sm hover:shadow-medium flex items-center justify-center gap-2 active:scale-95 transition-all mb-4"
        >
          <ThumbsUp className="w-5 h-5" />
          Escalate to Municipality ({request.upvote_count} votes)
        </button>

        {request.status !== 'installed' && (
          <button 
            onClick={onMunicipalAction}
            className="w-full bg-surface hover:bg-surface-raised text-foreground-secondary border border-border font-semibold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-colors mb-6"
          >
            <Building className="w-4 h-4" />
            I'm from the Municipality — Update Status
          </button>
        )}
      </div>
    </BottomSheet>
  );
}
