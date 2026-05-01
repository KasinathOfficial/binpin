import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  height?: 'auto' | '65%' | '72%' | '80%' | '92%';
  title?: string;
  accentBorder?: boolean;
}

export default function BottomSheet({ isOpen, onClose, children, height = 'auto', title, accentBorder = false }: BottomSheetProps) {
  const heightClasses = {
    'auto': 'h-auto max-h-[92dvh]',
    '65%': 'h-[65dvh]',
    '72%': 'h-[72dvh]',
    '80%': 'h-[80dvh]',
    '92%': 'h-[92dvh]'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-[2000]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.35 }}
            className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-surface z-[2010] shadow-strong rounded-t-xl ${accentBorder ? 'border-l-4 border-orange' : ''} ${heightClasses[height]} flex flex-col`}
          >
            {/* Drag Handle */}
            <div className="w-full pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing" onClick={onClose}>
              <div className="w-[36px] h-[4px] bg-border-strong rounded-full" />
            </div>
            
            {title && (
              <div className="px-4 pb-3 flex items-center justify-between border-b border-border">
                <h2 className="text-lg text-foreground">{title}</h2>
                <button onClick={onClose} className="p-2 -mr-2 text-foreground-secondary hover:text-foreground hover:bg-surface-raised rounded-md transition-colors" aria-label="Close sheet">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto px-4 py-4 overscroll-contain">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
