import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
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
    <div class="absolute w-10 h-10 rounded-full border-2 border-primary opacity-30 animate-pulse"></div>
    <div class="absolute w-4 h-4 rounded-full bg-primary opacity-30"></div>
    <div class="absolute w-2 h-2 rounded-full bg-primary shadow-sm"></div>
    <div class="absolute -bottom-4 text-[11px] font-medium text-foreground-muted whitespace-nowrap">You are here</div>
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
      <div style="filter: drop-shadow(0 2px 6px rgba(30,138,74,0.45))" class="${isReported ? 'opacity-40 grayscale' : ''} hover:scale-110 active:scale-95 transition-transform duration-200 ease-out origin-bottom relative">
        <!-- Green circle body -->
        <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#28c76f,#1E8A4A);border:3px solid #fff;box-shadow:0 0 0 2px ${ring};display:flex;align-items:center;justify-content:center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${binSvg}</svg>
        </div>
        <!-- Type label badge -->
        <div style="position:absolute;bottom:-10px;left:50%;transform:translateX(-50%);background:${ring};color:#fff;font-size:7px;font-weight:900;padding:1px 4px;border-radius:3px;white-space:nowrap;border:1px solid rgba(255,255,255,0.5);letter-spacing:0.05em;">${label}</div>
      </div>
    `,
    iconSize: [36, 48],
    iconAnchor: [18, 48]
  });
};

const createRequestIcon = () => L.divIcon({
  className: 'bg-transparent border-none focus:outline-none focus:ring-0 marker-transition',
  html: `<div class="w-8 h-8 border-2 border-orange border-dashed rounded-full bg-orange/20 shadow-medium flex items-center justify-center animate-pulse hover:scale-110 active:scale-95 transition-transform duration-200 cursor-pointer"><div class="w-3 h-3 bg-orange rounded-full"></div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

function MapUpdater({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 16, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export default function AppMap({ userLocation, bins, requests = [], onBinClick, onRequestClick, interactive = true, theme = 'dark' }: MapProps) {
  // Default to a central location in India
  const defaultCenter: [number, number] = [20.5937, 78.9629];
  const center = userLocation || defaultCenter;

  const createClusterCustomIcon = function (cluster: any) {
    const count = cluster.getChildCount();
    return L.divIcon({
      html: `<div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#28c76f,#1E8A4A);border:3px solid #fff;box-shadow:0 0 0 2px #1E8A4A,0 4px 12px rgba(30,138,74,0.4);display:flex;align-items:center;justify-content:center;cursor:pointer;font-weight:900;font-size:13px;color:#fff;font-family:inherit;transition:transform 0.2s;">${count}</div>`,
      className: 'bg-transparent border-none',
      iconSize: L.point(44, 44, true),
    });
  };

  return (
    <div className="w-full h-full z-0 relative">
      <MapContainer 
        center={center} 
        zoom={userLocation ? 15 : 5} 
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {userLocation && (
          <Marker position={userLocation} icon={createUserIcon()} />
        )}
        
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={45}
          spiderfyOnMaxZoom={true}
        >
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
                    Get Route
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
        </MarkerClusterGroup>

        <MapUpdater center={userLocation} />
      </MapContainer>
    </div>
  );
}
