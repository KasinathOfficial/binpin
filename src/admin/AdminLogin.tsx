import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { account } from '../lib/appwrite';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Try Appwrite Authentication if email provided
      if (email.includes('@')) {
        await account.createEmailPasswordSession(email, password);
        sessionStorage.setItem('admin_auth', 'true');
        navigate('/admin');
        return;
      }
      
      // 2. Fallback to Password only (Legacy Mode)
      const adminPass = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
      if (password === adminPass) {
        sessionStorage.setItem('admin_auth', 'true');
        navigate('/admin');
      } else {
        setError('Invalid credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="bg-slate-900/50 backdrop-blur-xl w-full max-w-md p-8 rounded-3xl shadow-2xl border border-slate-800">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/20 p-4 rounded-2xl text-primary mb-4 border border-primary/20 animate-pulse">
            <Shield className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Admin Secure Access</h1>
          <p className="text-sm text-slate-400 mt-2 text-center">Protected Command Center for BinPin Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Admin Email or Username</label>
            <input 
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@binpin.local (optional fallback)"
              className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white transition-all pl-10"
                required
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-4" />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl flex items-center gap-2">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <span>Secure Login</span>
                <Shield className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
