import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { account } from '../lib/appwrite';
import { LayoutDashboard, MapPin, MessageSquare, Heart, CheckSquare, LogOut, Shield, Menu, X } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  // Close mobile drawer on route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const checkAuth = async () => {
    try {
      const sessionAuth = sessionStorage.getItem('admin_auth') === 'true';
      
      try {
        const user = await account.get();
        setAdminUser(user);
        setLoading(false);
      } catch (appwriteError) {
        if (sessionAuth) {
          setAdminUser({ name: 'Admin User', email: 'admin@binpin.local' });
          setLoading(false);
        } else {
          navigate('/admin/login');
        }
      }
    } catch (error) {
      navigate('/admin/login');
    }
  };

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
    } catch (e) {
      // ignore
    }
    sessionStorage.removeItem('admin_auth');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/admin' },
    { id: 'bins', label: 'Manage Bins', icon: MapPin, path: '/admin/bins' },
    { id: 'requests', label: 'Bin Requests', icon: CheckSquare, path: '/admin/requests' },
    { id: 'comments', label: 'Comments', icon: MessageSquare, path: '/admin/comments' },
    { id: 'feedback', label: 'App Feedback', icon: Heart, path: '/admin/feedback' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Navigation */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-primary/20 p-1.5 rounded-lg text-primary">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-bold tracking-tight text-slate-200">BinPin Admin</span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
          aria-label="Toggle Mobile Menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-40 
        w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:flex md:w-64 pt-16 md:pt-0
      `}>
        <div className="p-6">
          <div className="hidden md:flex items-center gap-3 mb-8">
            <div className="bg-primary/20 p-2 rounded-xl text-primary">
              <Shield className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">BinPin Admin</span>
          </div>
          
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-400">{adminUser?.name || 'Administrator'}</span>
            <span className="text-[10px] text-slate-500 truncate max-w-[140px]">{adminUser?.email || 'admin@binpin.local'}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto w-full">
        <div className="max-w-7xl mx-auto">

          {children}
        </div>
      </main>
    </div>
  );
}
