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

const createBinIcon = (type: string, isReported: boolean = false) => {
  let dotColor = '#1E8A4A'; // General (Green primary)
  let svgPaths = '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>';
  
  if (type === 'organic') {
    dotColor = '#F29900'; // Orange
    svgPaths = '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>';
  } else if (type === 'medical') {
    dotColor = '#D93025'; // Red
    svgPaths = '<path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/>';
  } else if (type === 'recyclable') {
    dotColor = '#1967D2'; // Blue
    svgPaths = '<path d="M7 15.3l-2.6 4.7c-.2.4.2.8.6.6l4.6-2"/><path d="M11 16.5A6.9 6.9 0 0 0 17 21a6.9 6.9 0 0 0 5-2.2"/><path d="M17 8.7l2.6-4.7c.2-.4-.2-.8-.6-.6l-4.6 2"/><path d="M13 7.5A6.9 6.9 0 0 0 7 3a6.9 6.9 0 0 0-5 2.2"/><path d="M11 11H3.6a.4.4 0 0 0-.4.3l.5.2 3.8 2.3A4.2 4.2 0 0 1 11 11z"/>';
  }
  
  return L.divIcon({
    className: 'bg-transparent border-none focus:outline-none focus:ring-0 marker-transition',
    html: `
      <div class="hover:scale-110 active:scale-95 transition-transform duration-200 ease-out origin-bottom w-8 h-8 bg-white shadow-medium rounded-full flex items-center justify-center border-2 border-transparent hover:border-primary/20 ${isReported ? 'grayscale opacity-50' : ''}">
        <div style="background-color: ${dotColor}" class="w-5 h-5 rounded-full flex items-center justify-center shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${svgPaths}</svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
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
    return L.divIcon({
      html: `<div class="w-10 h-10 bg-white rounded-full flex items-center justify-center border-[3px] border-primary text-foreground font-semibold shadow-medium hover:scale-105 transition-transform duration-200 cursor-pointer"><span>${cluster.getChildCount()}</span></div>`,
      className: 'bg-transparent border-none',
      iconSize: L.point(40, 40, true),
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
