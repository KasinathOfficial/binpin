import { useState, useRef, useEffect } from 'react';
import { MapPin, ImagePlus, Check, AlertCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import BottomSheet from './ui/BottomSheet';

interface RequestBinSheetProps {
  onClose: () => void;
  userLocation: [number, number] | null;
  onSubmit: (data: any) => void;
}

const requestIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: `<div class="w-10 h-10 border-[3px] border-orange border-dashed rounded-full bg-orange-light shadow-medium flex items-center justify-center animate-pulse"><div class="w-4 h-4 bg-orange rounded-full"></div></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

function MapClicker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onLocationSelect(e.latlng.lat, e.latlng.lng); } });
  return null;
}

export default function RequestBinSheet({ onClose, userLocation, onSubmit }: RequestBinSheetProps) {
  const [selectedLoc, setSelectedLoc] = useState<[number, number] | null>(null);
  const [cityData, setCityData] = useState<string>('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1); // 1: Map, 2: Details
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state_district || 'Unknown location';
      setCityData(city);
      // Auto-fill address if possible
      if (data.display_name) {
        setAddress(data.display_name.split(',').slice(0, 3).join(','));
      }
    } catch (e) {
      setCityData('Unknown location');
    }
  };

  useEffect(() => {
    if (selectedLoc) {
      reverseGeocode(selectedLoc[0], selectedLoc[1]);
    }
  }, [selectedLoc]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const centerLoc = selectedLoc || userLocation || [20.5937, 78.9629];

  return (
    <BottomSheet isOpen={true} onClose={onClose} height="92%" title="Request a Dustbin" accentBorder>
      <div className="flex flex-col pb-4">
        <p className="text-sm text-foreground-muted mb-4 -mt-2">Mobilize your community to get a bin installed.</p>
        
        <div className="bg-orange-light border border-orange/20 p-3 rounded-lg flex gap-3 mb-6 items-start">
          <AlertCircle className="w-5 h-5 text-orange shrink-0 mt-0.5" />
          <p className="text-xs text-orange font-medium leading-relaxed">
            Requests are public. High-pressure requests will be sent to your local municipality.
          </p>
        </div>

        {step === 1 && (
          <div className="flex flex-col animate-slide-up space-y-4">
            <h3 className="text-sm font-bold text-foreground">1. Select Request Location</h3>
            <div className="h-[300px] w-full rounded-xl overflow-hidden shadow-inner border border-border relative">
              <MapContainer center={centerLoc} zoom={16} zoomControl={false} className="w-full h-full" dragging={true}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <MapClicker onLocationSelect={(lat, lng) => setSelectedLoc([lat, lng])} />
                {(selectedLoc || userLocation) && <Marker position={(selectedLoc || userLocation) as [number, number]} icon={requestIcon} />}
              </MapContainer>
              
              {!(selectedLoc || userLocation) && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-[1000] flex items-center justify-center pointer-events-none">
                  <p className="font-semibold text-foreground bg-white px-4 py-2 rounded-full shadow-medium">Tap map to set location</p>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => { if (selectedLoc || userLocation) setStep(2); }} 
              disabled={!(selectedLoc || userLocation)}
              className="w-full h-12 bg-orange hover:bg-orange/90 disabled:opacity-50 text-white font-bold rounded-lg shadow-medium flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              Confirm Request Location
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col animate-slide-up space-y-4">
            <h3 className="text-sm font-bold text-foreground">2. Details & Proof</h3>
            
            <div className="w-full p-4 bg-surface rounded-lg border border-border">
              <p className="text-xs text-foreground-muted uppercase tracking-widest font-bold mb-1">Target Area</p>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange" />
                <p className="text-sm text-foreground font-medium">{cityData || 'Detecting...'}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Specific Address / Landmark</label>
              <input 
                type="text"
                placeholder="e.g. Near Metro Station, Opp. Police Station" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-3 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-orange shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Issue Description</label>
              <textarea 
                placeholder="e.g. Frequent open dumping happening at this corner." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-orange h-20 resize-none shadow-sm"
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Proof Photo (Recommended)</label>
              <div className="w-full relative">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" />
                {photoPreview ? (
                  <div className="w-full h-32 rounded-lg overflow-hidden border border-border relative">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={() => fileInputRef.current?.click()} className="absolute top-2 right-2 bg-black/60 text-white px-3 py-1 rounded-md text-xs font-semibold backdrop-blur-md">
                      Change
                    </button>
                  </div>
                ) : (
                  <div onClick={() => fileInputRef.current?.click()} className="w-full h-24 border-2 border-dashed border-border hover:border-orange/50 bg-surface-raised hover:bg-orange/5 rounded-lg flex flex-col items-center justify-center text-foreground-muted cursor-pointer transition-colors active:scale-95">
                    <ImagePlus className="w-6 h-6 mb-1" />
                    <span className="text-sm font-medium">Tap to add photo</span>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => onSubmit({ lat: selectedLoc?.[0], lng: selectedLoc?.[1], address, description, photo: photoPreview, city: cityData })}
              disabled={!description.trim() || !cityData || !address.trim()}
              className="w-full h-12 bg-orange hover:bg-orange/90 disabled:opacity-50 text-white font-bold rounded-lg shadow-strong flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              Create Public Request <Check className="w-5 h-5 -mr-1" />
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
