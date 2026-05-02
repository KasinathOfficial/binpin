import { useEffect, useState } from 'react';
import { PartyPopper, Heart, Quote } from 'lucide-react';
import { getRandomQuote } from '../lib/quotes';

interface SuccessCelebrationProps {
  onClose: () => void;
  type?: 'add' | 'update' | 'request';
  title?: string;
  message?: string;
}

export default function SuccessCelebration({ onClose, type = 'add', title, message }: SuccessCelebrationProps) {
  const [quote] = useState(getRandomQuote());

  const content = {
    add: {
      title: title || "Beautiful Work!",
      message: message || "Your contribution is now helping thousands find a cleaner way.",
      button: "Keep Making Impact"
    },
    update: {
      title: title || "Update Saved!",
      message: message || "Precision is key. Your edits ensure everyone has the most accurate data.",
      button: "Return to Map"
    },
    request: {
      title: title || "Request Submitted!",
      message: message || "We've logged your request. Now, let's rally the community to escalate this!",
      button: "Track Progress"
    }
  }[type];

  useEffect(() => {
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-sm rounded-[32px] p-8 shadow-strong border border-primary/20 text-center animate-in zoom-in slide-in-from-bottom-10 duration-700 ease-spring overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-700" />

        <div className="relative z-10">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30 animate-bounce">
            <PartyPopper className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-2xl font-black text-foreground mb-2">{content.title}</h2>
          <p className="text-foreground-secondary font-medium mb-8 leading-snug">{content.message}</p>
          
          <div className="bg-surface rounded-2xl p-6 mb-8 relative border border-border/50">
            <Quote className="w-8 h-8 text-primary/10 absolute top-2 left-2" />
            <p className="text-sm font-bold text-foreground leading-relaxed italic relative z-10">
              "{quote}"
            </p>
          </div>

          <button 
            onClick={onClose}
            className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-medium hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Heart className="w-5 h-5 fill-white" /> {content.button}
          </button>
        </div>
      </div>
    </div>
  );
}
