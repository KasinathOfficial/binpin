import { useState, useRef } from 'react';
import { Camera, MapPin, ChevronRight, Check } from 'lucide-react';
import type { BinType } from '../lib/appwrite';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import BottomSheet from './ui/BottomSheet';

interface AddBinSheetProps {
  onClose: () => void;
  userLocation: [number, number] | null;
  onSubmit: (data: any) => void;
}

const addIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: `<div class="w-10 h-10 bg-white shadow-strong rounded-full flex items-center justify-center border-[3px] border-primary"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E8A4A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40]
});

function MapClicker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onLocationSelect(e.latlng.lat, e.latlng.lng); } });
  return null;
}

export default function AddBinSheet({ onClose, userLocation, onSubmit }: AddBinSheetProps) {
  const [step, setStep] = useState(1);
  const [selectedLoc, setSelectedLoc] = useState<[number, number] | null>(null);
  const [cityData, setCityData] = useState<string>('Unknown City');
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  const [label, setLabel] = useState('');
  const [type, setType] = useState<BinType>('general');
  const [notes, setNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const types: { value: BinType; label: string; color: string }[] = [
    { value: 'general', label: 'General', color: 'bg-primary' },
    { value: 'recyclable', label: 'Recycle', color: 'bg-blue' },
    { value: 'organic', label: 'Organic', color: 'bg-orange' },
    { value: 'medical', label: 'Medical', color: 'bg-red' },
  ];

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      setCityData(data.address?.city || data.address?.town || data.address?.village || data.address?.state_district || 'Unknown location');
    } catch (e) {
      setCityData('Unknown location');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleLocationConfirm = async () => {
    const loc = selectedLoc || userLocation;
    if (loc) {
      await reverseGeocode(loc[0], loc[1]);
      setStep(2);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    onSubmit({
      name: label.trim() || 'Anonymous Bin',
      type,
      notes,
      city: cityData,
      lat: selectedLoc?.[0] || userLocation?.[0],
      lng: selectedLoc?.[1] || userLocation?.[1],
      photo: photoPreview // Base64 handling would actually be multipart upload in Appwrite, but passed to parent for logic.
    });
  };

  const centerLoc = selectedLoc || userLocation || [20.5937, 78.9629];

  return (
    <BottomSheet isOpen={true} onClose={onClose} height="92%" title="Tag a New Bin" accentBorder>
      <div className="flex flex-col h-full">
        {/* Progress Bar */}
        <div className="w-full h-1 bg-surface-raised rounded-full mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-full bg-primary transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar pb-8">
          
          {step === 1 && (
            <div className="animate-slide-up h-full flex flex-col">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-foreground mb-1">Step 1: Location</h3>
                <p className="text-sm text-foreground-muted">Pin exactly where the bin is located.</p>
              </div>
              
              <div className="flex-1 min-h-[300px] w-full rounded-xl overflow-hidden shadow-inner border border-border relative">
                <MapContainer center={centerLoc} zoom={16} zoomControl={false} className="w-full h-full" dragging={true}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                  <MapClicker onLocationSelect={(lat, lng) => setSelectedLoc([lat, lng])} />
                  {(selectedLoc || userLocation) && <Marker position={(selectedLoc || userLocation) as [number, number]} icon={addIcon} />}
                </MapContainer>
                
                {!(selectedLoc || userLocation) && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-[1000] flex items-center justify-center pointer-events-none">
                    <p className="font-semibold text-foreground bg-white px-4 py-2 rounded-full shadow-medium">Tap map to pin location</p>
                  </div>
                )}
              </div>
              
              <button onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((p) => { setSelectedLoc([p.coords.latitude, p.coords.longitude]); });
                  }
                }}
                className="mt-4 w-full bg-surface-raised hover:bg-surface border border-border text-foreground font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-95"
              >
                <MapPin className="w-4 h-4" /> Use My Location
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-slide-up">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-1">Step 2: Bin Details</h3>
                <p className="text-sm text-foreground-muted">What kind of bin is it?</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Location Identifier</label>
                  <input type="text" placeholder="e.g. Near Bus Stop 12" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={50} className="w-full h-[48px] px-4 bg-white border border-border rounded-lg text-sm text-foreground font-medium focus:outline-none focus:border-primary shadow-sm" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Waste Type</label>
                  <div className="flex flex-wrap gap-2">
                    {types.map((t) => (
                      <button key={t.value} onClick={() => setType(t.value)} className={`flex-1 min-w-[45%] h-[48px] rounded-lg text-sm font-bold border transition-colors shadow-sm active:scale-95 ${type === t.value ? `${t.color} text-white border-transparent` : 'bg-white text-foreground-secondary border-border hover:bg-surface-raised'}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Notes (Optional)</label>
                  <textarea placeholder="e.g. inside the gate" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={100} className="w-full p-4 bg-white border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary h-24 resize-none shadow-sm" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-slide-up h-full flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-1">Step 3: Add Photo</h3>
                <p className="text-sm text-foreground-muted">Help others spot the bin easily (optional).</p>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[300px]">
                <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" />
                
                {photoPreview ? (
                  <div className="relative w-full h-[300px] rounded-xl overflow-hidden shadow-medium border border-border">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 backdrop-blur-md text-white rounded-full text-sm font-medium hover:bg-black/80 transition-colors shadow-lg active:scale-95">
                      Retake Photo
                    </button>
                  </div>
                ) : (
                  <div onClick={() => fileInputRef.current?.click()} className="w-full h-[300px] border-2 border-dashed border-border hover:border-primary/50 bg-surface-raised hover:bg-primary/5 rounded-xl flex flex-col items-center justify-center text-foreground-muted transition-colors cursor-pointer group active:scale-95">
                    <div className="w-16 h-16 bg-white rounded-full shadow-subtle flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Camera className="w-8 h-8 text-foreground-secondary" />
                    </div>
                    <span className="text-sm font-bold text-foreground">Tap to take photo</span>
                    <span className="text-xs mt-1">Or upload from gallery</span>
                  </div>
                )}
              </div>
              
              <button onClick={() => setStep(4)} className="mt-6 w-full text-center text-sm font-medium text-foreground-muted hover:text-foreground py-2 mb-2 transition-colors">
                Skip photo for now
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="animate-slide-up h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                <Check className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Ready to Submit</h3>
              <p className="text-foreground-secondary mb-6 max-w-[250px]">
                By submitting this bin, you agree it will be available for public viewing.
              </p>

              <div className="w-full bg-surface-raised rounded-xl p-4 mb-auto text-left border border-border shadow-sm">
                <p className="text-xs text-foreground-muted uppercase tracking-widest font-bold mb-1">Location Details</p>
                <p className="text-sm text-foreground font-medium mb-3">{cityData}</p>
                
                <p className="text-xs text-foreground-muted uppercase tracking-widest font-bold mb-1">Type</p>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${types.find(t => t.value === type)?.color}`} />
                  <p className="text-sm text-foreground font-medium">{types.find(t => t.value === type)?.label}</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="mt-auto border-t border-border pt-4 bg-background z-10 shrink-0">
          {step === 1 && (
            <button onClick={handleLocationConfirm} disabled={!(selectedLoc || userLocation) || isGeocoding} className="w-full h-[48px] bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-medium flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all">
              {isGeocoding ? 'Detecting Area...' : 'Confirm Pin'} <ChevronRight className="w-5 h-5 -mr-1" />
            </button>
          )}
          {step === 2 && (
            <button onClick={() => setStep(3)} className="w-full h-[48px] bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-medium flex items-center justify-center gap-2 active:scale-95 transition-all">
              Continue <ChevronRight className="w-5 h-5 -mr-1" />
            </button>
          )}
          {step === 3 && (
            <button onClick={() => setStep(4)} disabled={!photoPreview} className="w-full h-[48px] bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-medium flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all">
              Attach Photo <Check className="w-5 h-5 -mr-1" />
            </button>
          )}
          {step === 4 && (
            <>
              <button onClick={handleSubmit} className="w-full h-[48px] bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-strong flex items-center justify-center gap-2 active:scale-95 transition-all mb-2">
                Submit Public Bin
              </button>
              <p className="text-[11px] text-foreground-muted text-center font-medium">No login required. 100% anonymous.</p>
            </>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
