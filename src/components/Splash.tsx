import { useEffect } from 'react';

interface SplashProps {
  onStart: () => void;
}

export default function Splash({ onStart }: SplashProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onStart();
    }, 800);
    return () => clearTimeout(timer);
  }, [onStart]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-between p-8 bg-background">
      <div className="w-full flex-1 flex items-center justify-center">
        <img 
          src="/splash.png" 
          alt="Binpin Logo" 
          className="w-full max-w-sm object-contain animate-slide-up" 
        />
      </div>
      
      <div className="pb-8">
        <p className="text-xs text-muted-foreground font-medium tracking-wide">
          Anonymous · Free · Open Source
        </p>
      </div>
    </div>
  );
}
