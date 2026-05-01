import { useState, useEffect, useRef } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if already installed as PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Listen for Chrome's install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      // Show our banner shortly after
      setTimeout(() => setShowBanner(true), 1500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // For iOS, show manually after delay since there's no beforeinstallprompt
    if (ios) {
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }

    // Fallback: show banner after 3s even if no prompt event (for testing / some browsers)
    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt.current) {
        // If no native install prompt was captured, still show informational banner
        setShowBanner(true);
      }
    }, 3000);

    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt.current) {
      await deferredPrompt.current.prompt();
      const choice = await deferredPrompt.current.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      deferredPrompt.current = null;
    }
    setShowBanner(false);
  };

  if (isInstalled || !showBanner) return null;

  return (
    <div
      className="fixed bottom-20 inset-x-0 z-[9999] flex justify-center px-4 pointer-events-none"
      style={{ animation: 'slideUpFade 0.4s cubic-bezier(0.34,1.56,0.64,1) both' }}
    >
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(32px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>

      <div className="pointer-events-auto w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-white/20"
        style={{ background: 'linear-gradient(135deg, #1E8A4A 0%, #0f5c30 100%)' }}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #28c76f, #7fffc4, #28c76f)' }} />

        <div className="p-4 flex items-center gap-3">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 backdrop-blur-sm">
            <img src="/logo.png" alt="BinPin" className="w-8 h-8 object-contain" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-sm leading-tight">Install BinPin App</p>
            {isIOS ? (
              <p className="text-white/70 text-[11px] mt-0.5 leading-snug">
                Tap <span className="font-bold text-white">Share ↑</span> → "Add to Home Screen"
              </p>
            ) : (
              <p className="text-white/70 text-[11px] mt-0.5 leading-snug">
                Get the full experience – works offline too!
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {!isIOS && (
              <button
                onClick={handleInstall}
                className="bg-white text-emerald-700 font-black text-xs px-3 py-2 rounded-xl hover:bg-emerald-50 transition-colors flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                Install
              </button>
            )}
            {isIOS && (
              <span className="bg-white/20 text-white p-2 rounded-xl border border-white/30">
                <Smartphone className="w-4 h-4" />
              </span>
            )}
            <button
              onClick={() => setShowBanner(false)}
              className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
