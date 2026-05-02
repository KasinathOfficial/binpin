import { MapPin, Hash, Clock, Shield, CheckCircle2, ChevronLeft, ThumbsUp, Map as MapIcon, Calendar, Image as ImageIcon, Navigation, ExternalLink } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { formatDistanceToNow } from 'date-fns';
import type { BinRequest, MunicipalAction } from '../lib/appwrite';
import { hasUpvotedRequest } from '../lib/votes';

interface RequestDeepDetailProps {
  request: BinRequest;
  action?: MunicipalAction;
  onClose: () => void;
  onUpvote: () => void;
}

const needleIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: `
    <div class="relative flex flex-col items-center">
      <div class="w-7 h-7 bg-white rounded-full flex items-center justify-center border-2 border-orange shadow-strong">
        <div class="w-2.5 h-2.5 bg-orange rounded-full animate-pulse"></div>
      </div>
      <div class="w-0.5 h-5 bg-orange shadow-sm -mt-0.5"></div>
      <div class="w-1.5 h-1.5 bg-orange rounded-full -mt-0.5 shadow-subtle border border-white"></div>
    </div>
  `,
  iconSize: [28, 42],
  iconAnchor: [14, 42]
});

export default function RequestDeepDetail({ request, action, onClose, onUpvote }: RequestDeepDetailProps) {
  const isVoted = hasUpvotedRequest(request.id);
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${request.lat},${request.lng}`;
  const appleMapsUrl = `maps://maps.apple.com/?daddr=${request.lat},${request.lng}`;

  return (
    <div className="fixed inset-0 z-[2000] bg-white animate-in slide-in-from-right duration-300 flex flex-col">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-border p-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={onClose} className="p-2 hover:bg-surface-raised rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <div>
          <h2 className="text-lg font-black text-foreground tracking-tight">Citizen Request Audit</h2>
          <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">Tracking transparency in real-time</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {/* Hero Map View */}
        <div className="w-full h-72 bg-surface border-b border-border relative">
          <MapContainer center={[request.lat, request.lng]} zoom={18} zoomControl={false} className="w-full h-full grayscale-[0.2]">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            <Marker position={[request.lat, request.lng]} icon={needleIcon} />
          </MapContainer>
          
          <div className="absolute bottom-4 inset-x-4 flex flex-col gap-2">
            <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-strong border border-white/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange/10 rounded-xl flex items-center justify-center text-orange">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground-muted">Precise Pin</p>
                  <p className="text-xs font-black text-foreground">{request.lat.toFixed(6)}, {request.lng.toFixed(6)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a 
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-foreground text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <Navigation className="w-3 h-3" /> Google
                </a>
                <a 
                  href={appleMapsUrl}
                  className="bg-white text-foreground border border-border px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <MapIcon className="w-3 h-3" /> Apple
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Main Info */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border ${
                request.status === 'installed' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-orange/10 border-orange/20 text-orange'
              }`}>
                {request.status.replace('_', ' ')}
              </div>
              <div className="flex items-center gap-1.5 text-foreground-muted">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold">{formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</span>
              </div>
            </div>
            <h1 className="text-2xl font-black text-foreground leading-tight mb-4">{request.description}</h1>
            <div className="flex items-center gap-2 text-foreground-muted">
              <MapPin className="w-4 h-4" />
              <p className="text-sm font-bold">{request.city || 'Regional Area'} · {request.address || 'Precise Pin Location'}</p>
            </div>
          </section>

          {/* Citizen Impact */}
          <section className="bg-surface rounded-3xl p-6 border border-border shadow-inner">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <ThumbsUp className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-black text-foreground">{request.upvote_count}</span>
                </div>
                <p className="text-xs font-bold text-foreground-muted uppercase tracking-widest">Citizens supported this</p>
              </div>
              <button 
                onClick={onUpvote}
                disabled={isVoted}
                className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-medium transition-all active:scale-95 ${
                  isVoted 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'bg-primary text-white hover:bg-primary/90'
                }`}
              >
                {isVoted ? 'Supported' : 'Support Now'}
              </button>
            </div>
          </section>

          {/* Visual Data */}
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground-muted mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Visual Verification
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="rounded-3xl overflow-hidden border border-border shadow-medium relative group">
                <img 
                  src={request.photo_url || '/placeholder-bin.png'} 
                  alt="Original Issue" 
                  className="w-full aspect-video object-contain bg-black/5"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x450?text=Photo+Not+Found';
                  }}
                />
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider border border-white/10">
                  Citizen Proof
                </div>
              </div>

              {action?.proof_url && (
                <div className="rounded-3xl overflow-hidden border border-primary/30 shadow-medium relative group ring-4 ring-primary/5">
                  <img src={action.proof_url} alt="Official Action" className="w-full aspect-video object-contain bg-black/5" />
                  <div className="absolute top-4 left-4 bg-primary/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider border border-white/10">
                    Municipal Solution
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Action Log */}
          {action && (
            <section className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">Official Response</p>
                  <p className="text-sm font-black text-foreground">Municipal Accountability Log</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                  <p className="text-sm font-bold text-foreground leading-relaxed">{action.action_taken}</p>
                </div>
                <div className="pt-4 border-t border-primary/10 flex items-center justify-between">
                  <p className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">By {action.designation}</p>
                  <p className="text-[11px] font-medium text-foreground-muted">{formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}</p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Floating Bottom Action */}
      {!action && request.status !== 'installed' && (
        <div className="p-4 bg-gradient-to-t from-white via-white to-transparent pt-10">
          <div className="bg-surface rounded-2xl p-4 border border-border shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3 text-foreground-muted">
              <Clock className="w-5 h-5" />
              <p className="text-xs font-bold">Awaiting Municipal Action</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-border-strong" />
          </div>
        </div>
      )}
    </div>
  );
}
