import { useState } from 'react';
import { Plus, MapPin, AlertCircle, Shield, Menu, X, Trash2 } from 'lucide-react';

interface FloatingElementsProps {
  onAddClick: () => void;
  onRequestClick?: () => void;
  onMunicipalClick?: () => void;
  nearestBin?: {
    distance: number | string;
    name: string;
  };
  onNearestClick?: () => void;
}

export default function FloatingElements({ nearestBin, onNearestClick }: FloatingElementsProps) {
  return (
    <div className="absolute bottom-24 right-4 z-[1000] flex flex-col items-end gap-3 pointer-events-none">
      {nearestBin && (
        <button 
          onClick={onNearestClick}
          className="pointer-events-auto bg-white/90 backdrop-blur-md rounded-full shadow-soft px-4 py-2.5 border border-border flex items-center gap-2 text-sm font-medium animate-slide-up hover:bg-white"
        >
          <span className="text-primary"><MapPin className="w-4 h-4" /></span>
          <span>{nearestBin.distance}m · {nearestBin.name} &rarr;</span>
        </button>
      )}
    </div>
  );
}
