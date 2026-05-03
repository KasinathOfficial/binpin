import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Navigation2 } from 'lucide-react';
import type { Bin, BinRequest } from '../lib/appwrite';

interface MapProps {
  userLocation: [number, number] | null;
  bins: Bin[];
  requests?: BinRequest[];
  onBinClick: (bin: Bin) => void;
  onRequestClick?: (req: BinRequest) => void;
  onMapClick?: (lat: number, lng: number) => void;
  interactive?: boolean;
  theme?: 'light' | 'dark';
}

// Custom icons
const createUserIcon = () => L.divIcon({
  className: 'bg-transparent border-none',
  html: `<div class="w-10 h-10 flex items-center justify-center relative">
    <div class="absolute w-10 h-10 rounded-full border-2 border-blue-500 opacity-20 animate-pulse"></div>
    <div class="absolute w-4 h-4 rounded-full bg-blue-500 opacity-30 shadow-lg"></div>
    <div class="absolute w-2 h-2 rounded-full bg-blue-600 shadow-sm"></div>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const getBinTypeAccent = (type: string) => {
  switch (type) {
    case 'organic':    return { ring: '#F29900', label: 'ORG' };
    case 'medical':    return { ring: '#D93025', label: 'MED' };
    case 'recyclable': return { ring: '#1967D2', label: 'RCY' };
    default:           return { ring: '#1E8A4A', label: 'GEN' };
  }
};

const createBinIcon = (type: string, isReported: boolean = false) => {
  const { ring, label } = getBinTypeAccent(type);
  const binSvg = `<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>`;

  return L.divIcon({
    className: 'bg-transparent border-none focus:outline-none focus:ring-0 marker-transition',
    html: `
      <div class="${isReported ? 'opacity-40 grayscale' : ''} hover:scale-110 active:scale-95 transition-transform duration-200 ease-out origin-bottom relative flex flex-col items-center">
        <!-- Narrower Body -->
        <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#28c76f,#1E8A4A);border:2px solid #fff;box-shadow:0 0 0 1.5px ${ring}, 0 4px 10px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;z-index:10;">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${binSvg}</svg>
        </div>
        <!-- Sharp needle tip for precision -->
        <div style="width:2px;height:12px;background:${ring};margin-top:-2px;box-shadow:0 1px 2px rgba(0,0,0,0.1);z-index:5;"></div>
        <div style="width:4px;height:4px;border-radius:50%;background:${ring};margin-top:-2px;border:1px solid #fff;z-index:6;"></div>
        
        <!-- Type label badge -->
        <div style="position:absolute;bottom:-12px;left:50%;transform:translateX(-50%);background:${ring};color:#fff;font-size:6px;font-weight:900;padding:1px 3px;border-radius:2px;white-space:nowrap;border:1px solid rgba(255,255,255,0.4);letter-spacing:0.02em;z-index:20;">${label}</div>
      </div>
    `,
    iconSize: [28, 44],
    iconAnchor: [14, 44]
  });
};

const createRequestIcon = () => {
  return L.divIcon({
    className: 'bg-transparent border-none focus:outline-none focus:ring-0 marker-transition',
    html: `
      <div class="hover:scale-110 active:scale-95 transition-transform duration-200 ease-out origin-bottom relative flex flex-col items-center">
        <!-- Narrow Body -->
        <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#fb923c,#f97316);border:2px solid #fff;box-shadow:0 0 0 1.5px #f97316, 0 4px 10px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;z-index:10;">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
        </div>
        <!-- Sharp needle tip for precision -->
        <div style="width:2px;height:12px;background:#f97316;margin-top:-2px;box-shadow:0 1px 2px rgba(0,0,0,0.1);z-index:5;"></div>
        <div style="width:4px;height:4px;border-radius:50%;background:#f97316;margin-top:-2px;border:1px solid #fff;z-index:6;"></div>
        
        <!-- Type label badge -->
        <div style="position:absolute;bottom:-12px;left:50%;transform:translateX(-50%);background:#f97316;color:#fff;font-size:6px;font-weight:900;padding:1px 3px;border-radius:2px;white-space:nowrap;border:1px solid rgba(255,255,255,0.4);letter-spacing:0.02em;z-index:20;">REQUEST</div>
      </div>
    `,
    iconSize: [28, 44],
    iconAnchor: [14, 44]
  });
};

// Component to handle auto-recentering and user interaction detection
function MapController({ 
  userLocation, 
  shouldFollow, 
  setShouldFollow,
  initialCentered,
  setInitialCentered
}: { 
  userLocation: [number, number] | null; 
  shouldFollow: boolean;
  setShouldFollow: (val: boolean) => void;
  initialCentered: boolean;
  setInitialCentered: (val: boolean) => void;
}) {
  const map = useMap();

  // Detect user interactions to disable "follow mode"
  useMapEvents({
    dragstart: () => setShouldFollow(false),
    zoomstart: () => setShouldFollow(false),
    movestart: (e) => {
      // Only disable follow if it's a real user movement, not a flyTo
      if ((e as any).hard) return; 
    }
  });

  useEffect(() => {
    if (!userLocation) return;

    // First time location is found, center automatically
    if (!initialCentered) {
      map.flyTo(userLocation, 16, { duration: 1.5 });
      setInitialCentered(true);
      return;
    }

    // Subsequent updates only center if "follow mode" is on
    if (shouldFollow) {
      map.panTo(userLocation, { animate: true, duration: 0.5 });
    }
  }, [userLocation, shouldFollow, map, initialCentered, setInitialCentered]);

  return null;
}

export default function AppMap({ 
  userLocation, 
  bins, 
  requests = [], 
  onBinClick, 
  onRequestClick, 
  interactive = true, 
  theme = 'dark' 
}: MapProps) {
  const [shouldFollow, setShouldFollow] = useState(true);
  const [initialCentered, setInitialCentered] = useState(false);

  // Default to a central location in India
  const defaultCenter: [number, number] = [20.5937, 78.9629];
  const center = userLocation || defaultCenter;

  const handleRecenter = useCallback(() => {
    if (userLocation) {
      setShouldFollow(true);
    }
  }, [userLocation]);


  return (
    <div className="w-full h-full z-0 relative">
      <MapContainer 
        center={center} 
        zoom={userLocation ? 15 : 5} 
        maxZoom={22}
        zoomControl={false}
        className="w-full h-full"
        dragging={interactive}
        scrollWheelZoom={interactive}
        touchZoom={interactive}
      >
        <TileLayer
          key={theme}
          url={theme === 'dark' 
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
            : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
          }
          maxZoom={22}
          maxNativeZoom={19}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {userLocation && (
          <Marker position={userLocation} icon={createUserIcon()} />
        )}
        
        {bins.map((bin) => (
          <Marker 
            key={bin.id} 
            position={[bin.lat, bin.lng]} 
            icon={createBinIcon(bin.type, bin.report_count > 3)}
            eventHandlers={{ click: () => onBinClick(bin) }}
          >
            <Popup className="custom-popup">
              <div className="p-1 flex flex-col gap-2 min-w-[120px]">
                <p className="text-xs font-bold text-foreground leading-tight">{bin.name}</p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${bin.lat},${bin.lng}`, '_blank');
                  }}
                  className="w-full bg-primary text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-subtle flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-3 h-3" /> Get Route
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
        {requests.map((req) => (
          <Marker 
            key={req.id} 
            position={[req.lat, req.lng]} 
            icon={createRequestIcon()}
            eventHandlers={{ click: () => { if (onRequestClick) onRequestClick(req); } }}
          />
        ))}

        <MapController 
          userLocation={userLocation} 
          shouldFollow={shouldFollow} 
          setShouldFollow={setShouldFollow}
          initialCentered={initialCentered}
          setInitialCentered={setInitialCentered}
        />
      </MapContainer>

      {/* Recenter Button - Small Icon in bottom right */}
      {userLocation && (
        <button 
          onClick={handleRecenter}
          className={`
            absolute bottom-36 right-4 z-[1001] 
            bg-white text-primary 
            p-3 rounded-full shadow-strong border border-border/50
            flex items-center justify-center
            transition-all duration-300 ease-spring
            ${shouldFollow 
              ? 'opacity-0 pointer-events-none translate-x-12 scale-50' 
              : 'opacity-100 translate-x-0 scale-100'}
          `}
          title="Return to my location"
        >
          <Navigation2 className="w-5 h-5 fill-primary" />
        </button>
      )}
    </div>
  );
}
