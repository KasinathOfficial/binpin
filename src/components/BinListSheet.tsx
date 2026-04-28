import { useState } from 'react';
import { X, MapPin, ThumbsUp, AlertTriangle, ArrowUpDown, Info } from 'lucide-react';
import type { Bin } from '../lib/appwrite';
import { formatDistance, getDistance } from '../lib/geo';

interface BinListSheetProps {
  bins: Bin[];
  userLocation: [number, number] | null;
  onClose: () => void;
  onSelectBin: (bin: Bin) => void;
}

type SortMode = 'distance' | 'accurate' | 'reports';

export default function BinListSheet({ bins, userLocation, onClose, onSelectBin }: BinListSheetProps) {
  const [sortMode, setSortMode] = useState<SortMode>('distance');

  const filteredBins = bins.filter(bin => {
    if (!userLocation) return true;
    const distance = getDistance(userLocation[0], userLocation[1], bin.lat, bin.lng);
    return distance >= 0 && distance <= 500; // Showing all nearby up to 500m as requested
  });

  const sortedBins = [...filteredBins].sort((a, b) => {
    if (sortMode === 'distance' && userLocation) {
      const distA = getDistance(userLocation[0], userLocation[1], a.lat, a.lng);
      const distB = getDistance(userLocation[0], userLocation[1], b.lat, b.lng);
      return distA - distB;
    } else if (sortMode === 'accurate') {
      return b.upvote_count - a.upvote_count;
    } else if (sortMode === 'reports') {
      return b.report_count - a.report_count;
    }
    return 0;
  });

  return (
    <div className="absolute inset-0 z-[2000] flex items-end sm:items-center sm:justify-center pointer-events-none p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity" 
        onClick={onClose}
      />
      
      <div className="w-full max-w-sm max-h-[85vh] bg-white rounded-[32px] shadow-toast pointer-events-auto flex flex-col relative z-10 animate-slide-up border border-border overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-border bg-white pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">📑</span> Bins List
            </h2>
            <button 
              onClick={onClose}
              className="bg-muted hover:bg-muted-foreground/10 p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex bg-surface rounded-2xl p-1 shadow-inner border border-border">
            <button 
              onClick={() => setSortMode('distance')}
              className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition-all ${
                sortMode === 'distance' ? 'bg-primary text-white shadow-medium' : 'text-foreground/70 hover:text-foreground'
              }`}
            >
              Nearest
            </button>
            <button 
              onClick={() => setSortMode('accurate')}
              className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition-all ${
                sortMode === 'accurate' ? 'bg-primary text-white shadow-medium' : 'text-foreground/70 hover:text-foreground'
              }`}
            >
              Accurate
            </button>
            <button 
              onClick={() => setSortMode('reports')}
              className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition-all ${
                sortMode === 'reports' ? 'bg-primary text-white shadow-medium' : 'text-foreground/70 hover:text-foreground'
              }`}
            >
              Flagged
            </button>
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sortedBins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground opacity-70">
              <MapPin className="w-12 h-12 mb-3 text-muted-foreground/50" />
              <p className="font-medium text-sm">No bins found within 500m.</p>
            </div>
          ) : (
            sortedBins.map(bin => {
              let distLabel = '';
              if(userLocation) {
                const meters = getDistance(userLocation[0], userLocation[1], bin.lat, bin.lng);
                distLabel = formatDistance(meters);
              }
              return (
                <div 
                  key={bin.id}
                  className="bg-surface rounded-[24px] p-4 border border-border/50 hover:border-primary/30 transition-all cursor-pointer group"
                  onClick={() => onSelectBin(bin)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      bin.type === 'organic' ? 'bg-orange-100 text-orange-600' :
                      bin.type === 'medical' ? 'bg-red-100 text-red-600' :
                      bin.type === 'recyclable' ? 'bg-blue-100 text-blue-600' :
                      'bg-primary/10 text-primary'
                    }`}>
                      <img src="/logo.png" style={{ filter: 'brightness(0) saturate(100%) invert(35%) sepia(87%) saturate(378%) hue-rotate(93deg) brightness(88%) contrast(90%)' }} className="w-7 h-7 object-contain" alt="bin" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-foreground truncate text-sm">{bin.name}</div>
                      <div className="text-[11px] text-foreground-muted mt-1 font-semibold flex items-center gap-2">
                        <span className="capitalize px-2 py-0.5 bg-muted rounded-md">{bin.type}</span>
                        {distLabel && <span className="text-primary font-black tracking-tight">{distLabel} away</span>}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-primary hover:scale-105 transition-transform">
                        <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({bin.upvote_count})
                      </button>
                      <button className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-foreground-secondary hover:scale-105 transition-transform">
                        <Info className="w-3.5 h-3.5" /> Comment
                      </button>
                    </div>
                    {bin.report_count > 0 && (
                      <div className="flex items-center gap-1 text-[9px] font-black uppercase text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                        <AlertTriangle className="w-3 h-3" /> {bin.report_count} Reports
                      </div>
                    )}
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
