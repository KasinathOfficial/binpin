import { ListFilter } from 'lucide-react';

interface BottomBarProps {
  activeFilter: number;
  onFilterChange: (dist: number) => void;
  onListClick: () => void;
  stats: {
    totalBins: number;
    cityCount: number;
    openRequests: number;
  };
}

export default function BottomBar({ onListClick, stats }: BottomBarProps) {
  return (
    <div className="absolute bottom-4 inset-x-0 z-[1001] px-4 pointer-events-none flex items-center justify-center">
      {/* Ultra-Compact Unified Control Pill */}
      <div className="bg-foreground/95 backdrop-blur-xl px-2 py-1 rounded-[20px] shadow-strong border border-white/10 flex items-center gap-2 pointer-events-auto ring-1 ring-black/20">
        <div className="flex items-center gap-3 px-3 py-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-black text-white uppercase tracking-[0.1em] whitespace-nowrap">{stats.totalBins.toLocaleString()} Bins</span>
          </div>
          <div className="w-[1px] h-2.5 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black text-white uppercase tracking-[0.1em] whitespace-nowrap">{stats.cityCount} Cities</span>
          </div>
          <div className="w-[1px] h-2.5 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black text-orange uppercase tracking-[0.1em] whitespace-nowrap">{stats.openRequests} Requests</span>
          </div>
        </div>

        <div className="w-[1px] h-6 bg-white/10" />

        <button 
          onClick={onListClick}
          className="bg-white text-foreground p-2 rounded-[14px] shadow-medium flex items-center justify-center transition-all active:scale-90 hover:bg-surface-raised"
          aria-label="View List"
        >
          <ListFilter className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
