import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { account } from '../lib/appwrite';
import { Shield, Lock, User, CheckCircle2 } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRobot, setIsRobot] = useState(true);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaChallenge, setCaptchaChallenge] = useState({ a: 0, b: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Generate simple math challenge
    setCaptchaChallenge({
      a: Math.floor(Math.random() * 10) + 1,
      b: Math.floor(Math.random() * 10) + 1
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Verification check
    if (parseInt(captchaAnswer) !== (captchaChallenge.a + captchaChallenge.b)) {
      setError('Identity verification failed. Please try again.');
      return;
    }

    setLoading(true);

    try {
      if (email.includes('@')) {
        await account.createEmailPasswordSession(email, password);
        sessionStorage.setItem('admin_auth', 'true');
        navigate('/admin');
        return;
      }
      
      const adminPass = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
      if (password === adminPass) {
        sessionStorage.setItem('admin_auth', 'true');
        navigate('/admin');
      } else {
        setError('The password you entered is incorrect.');
      }
    } catch (err: any) {
      setError(err.message || 'Access denied. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[400px]">
        {/* Security Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-200 mb-4">
            <Shield className="w-8 h-8 text-slate-900" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security Gateway</h1>
          <p className="text-sm text-slate-500 mt-1">Authorized access only. All activities are logged.</p>
        </div>

        {/* Login Form */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Identifier</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Username or Email"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Security Key</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm"
                  required
                />
              </div>
            </div>

            {/* Simple Verification Gate */}
            <div className="pt-2 pb-1">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    onClick={() => setIsRobot(!isRobot)}
                    className={`w-5 h-5 rounded border transition-all cursor-pointer flex items-center justify-center ${!isRobot ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-300'}`}
                  >
                    {!isRobot && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-sm font-medium text-slate-700">I am not a robot</span>
                </div>
                
                {!isRobot && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <p className="text-[11px] font-bold text-slate-500 uppercase mb-2">Solve: {captchaChallenge.a} + {captchaChallenge.b} = ?</p>
                    <input 
                      type="number"
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-900"
                      placeholder="Answer"
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded-lg font-medium">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || isRobot}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
            >
              {loading ? "Authorizing..." : "Authenticate"}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-8 font-medium uppercase tracking-[0.2em]">
          Powered by BinPin Security Protocol v2.4
        </p>
      </div>
    </div>
  );
}

