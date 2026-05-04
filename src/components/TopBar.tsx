import { Search, MessageSquare, Moon, Sun, Plus, AlertCircle, Shield, HelpCircle } from 'lucide-react';

interface TopBarProps {
  onSearch: (query: string) => void;
  onFeedbackClick: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onAddClick: () => void;
  onRequestClick: () => void;
  onMunicipalClick: () => void;
  onHelpClick: () => void;
  isNewUser?: boolean;
}

export default function TopBar({ 
  onSearch, 
  onFeedbackClick, 
  theme = 'dark', 
  onToggleTheme,
  onAddClick,
  onRequestClick,
  onMunicipalClick,
  onHelpClick,
  isNewUser
}: TopBarProps) {
  return (
    <div className="absolute top-0 inset-x-0 z-[1001] p-3 pointer-events-none">
      <div className="max-w-2xl mx-auto flex flex-col gap-2.5">
        {/* Unified Search Bar */}
        <div className="bg-white/95 backdrop-blur-xl rounded-[28px] shadow-strong border border-border/50 flex items-center p-1.5 pointer-events-auto ring-1 ring-black/5">
          <div className="flex items-center flex-1 px-2.5">
            <Search className="w-4 h-4 text-foreground-muted mr-2.5" />
            <input 
              type="text" 
              placeholder="Find a bin or location..." 
              className="bg-transparent border-none outline-none w-full text-sm font-semibold text-foreground placeholder:text-foreground-muted/70 h-8"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-1 border-l border-border/50 pl-1.5">
            {onToggleTheme && (
              <button 
                onClick={onToggleTheme}
                className="p-2 rounded-xl hover:bg-surface-raised transition-all active:scale-90 text-foreground-secondary"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-orange" /> : <Moon className="w-4 h-4 text-blue" />}
              </button>
            )}
            <button 
              onClick={onFeedbackClick}
              className="p-2 rounded-xl hover:bg-surface-raised transition-all active:scale-90 text-foreground-secondary"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Minimal Action Pills */}
        <div className="flex gap-2 pointer-events-auto justify-center">
          <button 
            onClick={() => { console.log("Add Bin Clicked"); onAddClick(); }}
            className="bg-primary text-white px-4 py-2 rounded-full shadow-medium flex items-center gap-1.5 text-[11px] font-extrabold tracking-tight active:scale-95 transition-all hover:brightness-110 ring-2 ring-white"
          >
            <Plus className="w-3.5 h-3.5" /> ADD BIN
          </button>
          <button 
            onClick={() => { console.log("Request Bin Clicked"); onRequestClick(); }}
            className="bg-white/95 backdrop-blur-md text-foreground px-4 py-2 rounded-full shadow-soft border border-border/50 flex items-center gap-1.5 text-[11px] font-extrabold tracking-tight active:scale-95 transition-all hover:bg-surface ring-2 ring-white"
          >
            <AlertCircle className="w-3.5 h-3.5 text-orange" /> REQUEST BIN
          </button>
          <button 
            onClick={() => { console.log("Board Clicked"); onMunicipalClick(); }}
            className="bg-white/95 backdrop-blur-md text-foreground px-4 py-2 rounded-full shadow-soft border border-border/50 flex items-center gap-1.5 text-[11px] font-extrabold tracking-tight active:scale-95 transition-all hover:bg-surface ring-2 ring-white"
          >
            <Shield className="w-3.5 h-3.5 text-blue" /> BOARD
          </button>
          <div className="relative">
            <button 
              onClick={onHelpClick}
              className="bg-white/95 backdrop-blur-md text-foreground w-10 h-10 rounded-full shadow-soft border border-border/50 flex items-center justify-center active:scale-95 transition-all hover:bg-surface ring-2 ring-white shrink-0"
              title="Help & Permissions"
            >
              <HelpCircle className="w-4 h-4 text-primary" />
            </button>
            {isNewUser && (
              <>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border border-white" />
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
