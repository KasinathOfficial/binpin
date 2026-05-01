import { useState } from 'react';
import { X, MapPin, ThumbsUp, AlertTriangle, ImageOff, Trash2, Clock } from 'lucide-react';
import type { Bin } from '../lib/appwrite';
import { formatDistance, getDistance } from '../lib/geo';
import { formatDistanceToNow } from 'date-fns';

interface BinListSheetProps {
  bins: Bin[];
  userLocation: [number, number] | null;
  onClose: () => void;
  onSelectBin: (bin: Bin) => void;
}

type SortMode = 'distance' | 'accurate' | 'reports' | 'newest';

const TYPE_CONFIG: Record<string, { bg: string; text: string; ring: string; label: string }> = {
  general:    { bg: 'bg-emerald-50',  text: 'text-emerald-700', ring: 'ring-emerald-400', label: 'General' },
  recyclable: { bg: 'bg-blue-50',     text: 'text-blue-700',    ring: 'ring-blue-400',    label: 'Recyclable' },
  organic:    { bg: 'bg-amber-50',    text: 'text-amber-700',   ring: 'ring-amber-400',   label: 'Organic' },
  medical:    { bg: 'bg-red-50',      text: 'text-red-700',     ring: 'ring-red-400',     label: 'Medical' },
};

export default function BinListSheet({ bins, userLocation, onClose, onSelectBin }: BinListSheetProps) {
  const [sortMode, setSortMode] = useState<SortMode>('distance');

  const sortedBins = [...bins].sort((a, b) => {
    if (sortMode === 'distance' && userLocation) {
      const distA = getDistance(userLocation[0], userLocation[1], a.lat, a.lng);
      const distB = getDistance(userLocation[0], userLocation[1], b.lat, b.lng);
      return distA - distB;
    } else if (sortMode === 'accurate') {
      return b.upvote_count - a.upvote_count;
    } else if (sortMode === 'reports') {
      return b.report_count - a.report_count;
    } else if (sortMode === 'newest') {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    }
    return 0;
  });

  const sortButtons: { mode: SortMode; label: string }[] = [
    { mode: 'distance', label: 'Nearest' },
    { mode: 'newest',   label: 'Newest' },
    { mode: 'accurate', label: 'Popular' },
    { mode: 'reports',  label: 'Flagged' },
  ];

  return (
    <div className="absolute inset-0 z-[2000] flex items-end sm:items-center sm:justify-center pointer-events-none p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity"
        onClick={onClose}
      />

      <div className="w-full max-w-md max-h-[90vh] bg-white rounded-[32px] shadow-toast pointer-events-auto flex flex-col relative z-10 animate-slide-up border border-border overflow-hidden">

        {/* Header */}
        <div className="p-5 border-b border-border bg-white pb-4 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-primary" />
                </span>
                Nearby Bins
              </h2>
              <p className="text-xs text-foreground-muted mt-1 font-medium">
                {sortedBins.length} bin{sortedBins.length !== 1 ? 's' : ''} on the map
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-muted hover:bg-muted-foreground/10 p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sort Tabs */}
          <div className="flex bg-surface rounded-2xl p-1 shadow-inner border border-border gap-0.5">
            {sortButtons.map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => setSortMode(mode)}
                className={`flex-1 py-2 px-1 text-[11px] font-bold rounded-xl transition-all ${
                  sortMode === mode
                    ? 'bg-primary text-white shadow-medium'
                    : 'text-foreground/70 hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sortedBins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground opacity-70">
              <MapPin className="w-12 h-12 mb-3 text-muted-foreground/50" />
              <p className="font-medium text-sm">No bins found.</p>
              <p className="text-xs mt-1">Be the first to tag a bin nearby!</p>
            </div>
          ) : (
            sortedBins.map(bin => {
              const cfg = TYPE_CONFIG[bin.type] || TYPE_CONFIG.general;
              let distLabel = '';
              if (userLocation) {
                const meters = getDistance(userLocation[0], userLocation[1], bin.lat, bin.lng);
                distLabel = formatDistance(meters);
              }
              const timeAgo = bin.created_at
                ? formatDistanceToNow(new Date(bin.created_at), { addSuffix: true })
                : null;

              return (
                <div
                  key={bin.id}
                  className="bg-white rounded-[20px] border border-border/60 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group overflow-hidden"
                  onClick={() => onSelectBin(bin)}
                >
                  {/* Photo strip */}
                  {bin.photo_url ? (
                    <div className="w-full h-28 overflow-hidden relative">
                      <img
                        src={bin.photo_url}
                        alt={bin.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <span className={`absolute bottom-2 left-3 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                      {distLabel && (
                        <span className="absolute bottom-2 right-3 text-[10px] font-black text-white bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
                          {distLabel} away
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className={`w-full h-16 flex items-center justify-center ${cfg.bg} relative`}>
                      <ImageOff className={`w-6 h-6 ${cfg.text} opacity-40`} />
                      <span className={`absolute bottom-2 left-3 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 ${cfg.text}`}>
                        {cfg.label}
                      </span>
                      {distLabel && (
                        <span className="absolute bottom-2 right-3 text-[10px] font-black text-foreground bg-white/80 px-2 py-0.5 rounded-full">
                          {distLabel} away
                        </span>
                      )}
                    </div>
                  )}

                  {/* Info Section */}
                  <div className="p-3">
                    <div className="font-bold text-foreground text-sm truncate mb-0.5">{bin.name}</div>

                    {/* Notes */}
                    {bin.notes && (
                      <p className="text-[11px] text-foreground-muted italic truncate mb-1">"{bin.notes}"</p>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center gap-2 text-[10px] text-foreground-muted flex-wrap mt-1">
                      {timeAgo && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> {timeAgo}
                        </span>
                      )}
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[11px] font-bold text-primary">
                          <ThumbsUp className="w-3 h-3" /> {bin.upvote_count}
                        </span>
                      </div>
                      {bin.report_count > 0 && (
                        <div className="flex items-center gap-1 text-[10px] font-black uppercase text-red-500 bg-red-50 px-2 py-0.5 rounded-lg">
                          <AlertTriangle className="w-3 h-3" /> {bin.report_count} Reported
                        </div>
                      )}
                      <span className="text-[10px] text-foreground-muted font-medium">Tap to view →</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
