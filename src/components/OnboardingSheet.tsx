import { useState, useEffect } from 'react';
import { Shield, MapPin, Camera, Check, ChevronRight, Info, Sparkles, Trash2, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BottomSheet from './ui/BottomSheet';

interface OnboardingSheetProps {
  onClose: () => void;
}

export default function OnboardingSheet({ onClose }: OnboardingSheetProps) {
  const [step, setStep] = useState(1);
  const [mission, setMission] = useState(0); // 0: Pin, 1: Request, 2: Board
  const [perms, setPerms] = useState({
    location: 'prompt',
    camera: 'prompt'
  });

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const loc = await navigator.permissions.query({ name: 'geolocation' });
        const cam = await navigator.permissions.query({ name: 'camera' as any });
        
        setPerms({
          location: loc.state,
          camera: cam.state
        });

        loc.onchange = () => setPerms(prev => ({ ...prev, location: loc.state }));
        cam.onchange = () => setPerms(prev => ({ ...prev, camera: cam.state }));
      } catch (e) {
        console.warn('Permissions API partial support');
      }
    };
    checkPermissions();
  }, []);

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {},
        (err) => {
          if (err.code === 1) alert('Permission denied. Please enable location in your browser settings.');
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
    } catch (err) {
      alert('Camera access denied. Please enable it in browser settings.');
    }
  };

  const missions = [
    {
      title: "Pin a Bin",
      subtitle: "Add existing public bins",
      color: "primary",
      bgClass: "bg-primary",
      borderClass: "border-primary/10",
      lightBgClass: "bg-primary/5",
      icon: <MapPin className="w-6 h-6" />,
      steps: [
        { title: "Spot a Bin", desc: "Found a public dustbin? Stand near it.", num: 1 },
        { title: "Snap a Photo", desc: "Take a clear picture of the bin.", num: 2 },
        { title: "Pin it", desc: "Mark the location on the live map.", num: 3 }
      ]
    },
    {
      title: "Request a Bin",
      subtitle: "For spots with waste",
      color: "orange",
      bgClass: "bg-orange",
      borderClass: "border-orange/10",
      lightBgClass: "bg-orange/5",
      icon: <Trash2 className="w-6 h-6" />,
      steps: [
        { title: "Saw the Waste", desc: "Spot a place where a bin is needed.", num: 1 },
        { title: "Tag a Photo", desc: "Document the waste accumulation.", num: 2 },
        { title: "Request Bin", desc: "Submit a request for a new installation.", num: 3 }
      ]
    },
    {
      title: "The Board",
      subtitle: "Municipal Transparency",
      color: "blue",
      bgClass: "bg-blue",
      borderClass: "border-blue/10",
      lightBgClass: "bg-blue/5",
      icon: <LayoutDashboard className="w-6 h-6" />,
      steps: [
        { title: "View Board", desc: "See all pending bin requests in your city.", num: 1 },
        { title: "Track Progress", desc: "Check which requests are under review.", num: 2 },
        { title: "Push for Action", desc: "Help put pressure on the municipal team.", num: 3 }
      ]
    }
  ];

  const allGranted = perms.location === 'granted' && perms.camera === 'granted';

  return (
    <BottomSheet isOpen={true} onClose={onClose} height="auto" title="How to use BinPin?" accentBorder>
      <div className="pb-8">
        {step === 1 ? (
          <div className="space-y-6">
            {/* Mission Selector Tabs */}
            <div className="flex bg-surface-raised p-1.5 rounded-2xl border border-border">
              {missions.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => setMission(idx)}
                  className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 ${
                    mission === idx 
                    ? `${m.bgClass} text-white shadow-subtle` 
                    : 'text-foreground-muted hover:bg-black/5'
                  }`}
                >
                  {m.icon}
                  {m.title}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={mission}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="text-center px-4">
                  <p className="text-xs font-bold text-foreground-muted mb-1">{missions[mission].subtitle}</p>
                  <h3 className="text-xl font-black text-foreground">Mission: {missions[mission].title}</h3>
                </div>

                <div className="grid gap-3 mt-4">
                  {missions[mission].steps.map((s, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`flex items-start gap-4 p-4 ${missions[mission].lightBgClass} rounded-2xl border ${missions[mission].borderClass} group`}
                    >
                      <div className={`w-8 h-8 ${missions[mission].bgClass} text-white rounded-full flex items-center justify-center shrink-0 font-bold shadow-sm group-hover:scale-110 transition-transform`}>
                        {s.num}
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm">{s.title}</p>
                        <p className="text-[11px] text-foreground-muted leading-relaxed">{s.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            <button 
              onClick={() => setStep(2)}
              className="w-full h-14 bg-foreground text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all group mt-4"
            >
              Setup Permissions <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center px-4">
              <div className="mb-6 bg-white rounded-3xl p-6 shadow-soft relative">
                <Shield className="w-12 h-12 text-blue" />
                {allGranted && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-green-500 text-white p-1 rounded-full shadow-lg"
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                )}
              </div>
              <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">Permissions</h2>
              <p className="text-sm text-foreground-muted max-w-[220px]">We need these to make the magic happen.</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-surface-raised rounded-2xl border border-border transition-all hover:border-primary/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <MapPin className={`w-5 h-5 ${perms.location === 'granted' ? 'text-green-500' : 'text-primary'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Location Access</p>
                    <p className="text-[10px] text-foreground-muted">To pin bins accurately.</p>
                  </div>
                </div>
                <button 
                  onClick={requestLocation}
                  disabled={perms.location === 'granted'}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 ${
                    perms.location === 'granted' 
                    ? 'bg-green-500/10 text-green-600 cursor-default' 
                    : 'bg-primary text-white shadow-subtle'
                  }`}
                >
                  {perms.location === 'granted' ? <><Check className="w-3 h-3" /> Ready</> : 'Grant'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-surface-raised rounded-2xl border border-border transition-all hover:border-blue/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Camera className={`w-5 h-5 ${perms.camera === 'granted' ? 'text-green-500' : 'text-blue'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Camera Access</p>
                    <p className="text-[10px] text-foreground-muted">For instant bin photos.</p>
                  </div>
                </div>
                <button 
                  onClick={requestCamera}
                  disabled={perms.camera === 'granted'}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 ${
                    perms.camera === 'granted' 
                    ? 'bg-green-500/10 text-green-600 cursor-default' 
                    : 'bg-blue text-white shadow-subtle'
                  }`}
                >
                  {perms.camera === 'granted' ? <><Check className="w-3 h-3" /> Ready</> : 'Grant'}
                </button>
              </div>
            </div>

            { (perms.location === 'denied' || perms.camera === 'denied') && (
              <div className="bg-orange/5 border border-orange/20 p-4 rounded-2xl flex gap-3">
                <Info className="w-5 h-5 text-orange shrink-0 mt-0.5" />
                <p className="text-[11px] text-orange font-medium leading-relaxed">
                  Reset denied permissions in your browser settings for <strong>binpin.live</strong>
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => setStep(1)}
                className="w-1/3 h-14 bg-surface-raised text-foreground rounded-2xl font-bold uppercase text-[10px] tracking-widest active:scale-95 transition-all border border-border"
              >
                Back
              </button>
              <button 
                onClick={onClose}
                className={`flex-1 h-14 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-strong ${
                  allGranted ? 'bg-green-600 text-white' : 'bg-primary text-white'
                }`}
              >
                {allGranted ? 'Start Pinning' : 'Done'} <Check className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
