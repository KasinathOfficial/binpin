import { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  Search, 
  Filter, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  MapPin,
  ChevronRight,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { databases } from '../lib/appwrite';
import type { BinRequest } from '../lib/appwrite';
import { Query } from 'appwrite';
import { formatDistanceToNow } from 'date-fns';

const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const reqsId = import.meta.env.VITE_APPWRITE_REQUESTS_COLLECTION_ID;

export default function MunicipalDashboard() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<BinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'requested' | 'action_taken' | 'installed'>('all');

  useEffect(() => {
    async function fetchRequests() {
      if (!dbId || !reqsId) return;
      try {
        const resp = await databases.listDocuments(dbId, reqsId, [
          Query.orderDesc('upvote_count'),
          Query.limit(100)
        ]);
        setRequests(resp.documents.map(d => ({ ...d, id: d.$id })) as unknown as BinRequest[]);
      } catch (e: any) {
        if (e.code === 404) {
          console.warn(`MunicipalDashboard: Requests collection (${reqsId}) not found.`);
        } else {
          console.error(e);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchesSearch = (r.city?.toLowerCase() || '').includes(search.toLowerCase()) || 
                           (r.description?.toLowerCase() || '').includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      pending: requests.filter(r => r.status === 'requested').length,
      solved: requests.filter(r => r.status === 'installed').length,
      totalUpvotes: requests.reduce((acc, r) => acc + (r.upvote_count || 0), 0)
    };
  }, [requests]);

  return (
    <div className="min-h-screen bg-surface flex flex-col container mx-auto max-w-2xl px-0 md:px-4">
      {/* Header */}
      <header className="bg-white px-4 py-6 border-b border-border shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => navigate('/')} 
            className="p-2 -ml-2 hover:bg-surface-raised rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Municipal Response Hub</h1>
            <p className="text-[11px] font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Official Authority Access
            </p>
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-orange-light/30 border border-orange/10 p-3 rounded-xl">
            <p className="text-[10px] font-bold text-orange uppercase tracking-wider mb-1">Open Requests</p>
            <p className="text-xl font-black text-foreground">{stats.pending}</p>
          </div>
          <div className="bg-primary/10 border border-primary/10 p-3 rounded-xl">
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Solved Today</p>
            <p className="text-xl font-black text-foreground">{stats.solved}</p>
          </div>
          <div className="bg-blue-light/30 border border-blue/10 p-3 rounded-xl">
            <p className="text-[10px] font-bold text-blue uppercase tracking-wider mb-1">Total Pressure</p>
            <p className="text-xl font-black text-foreground">{stats.totalUpvotes}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input 
              type="text" 
              placeholder="Search by city or description..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors font-medium shadow-inner"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {(['all', 'requested', 'action_taken', 'installed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  statusFilter === s 
                    ? 'bg-foreground text-white border-foreground shadow-medium translate-y-[-1px]' 
                    : 'bg-white text-foreground-muted border-border hover:border-foreground-muted'
                }`}
              >
                {s.toUpperCase().replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Request List */}
      <main className="flex-1 px-4 py-6 space-y-4 pb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-50">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold uppercase tracking-widest text-foreground-muted">Loading Priority Feed...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
            <CheckCircle2 className="w-12 h-12 text-primary mb-4" />
            <p className="text-lg font-bold text-foreground">Zero pending requests in this filter</p>
            <p className="text-sm text-foreground-muted">Everything is looking clean!</p>
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div 
              key={req.id} 
              className="group bg-white rounded-2xl border border-border shadow-subtle overflow-hidden hover:border-primary/30 transition-all active:scale-[0.99] cursor-pointer"
              onClick={() => navigate(`/submit-action/${req.id}`)}
            >
              <div className="p-4 flex items-start gap-4">
                {/* Status Indicator Bar */}
                <div className={`w-1.5 self-stretch rounded-full ${
                  req.status === 'requested' ? 'bg-orange' : 
                  req.status === 'installed' ? 'bg-primary' : 'bg-blue'
                }`} />

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-primary mb-0.5">
                        <MapPin className="w-3 h-3" /> {req.city || 'Regional'}
                      </div>
                      <p className="text-[10px] text-foreground-muted font-bold flex items-center gap-1 uppercase tracking-wider">
                        <Clock className="w-3 h-3" /> 
                        {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-orange-light/30 border border-orange/10 px-2.5 py-1 rounded-lg">
                      <TrendingUp className="w-3.5 h-3.5 text-orange" />
                      <span className="text-xs font-black text-orange">{req.upvote_count || 0}</span>
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-foreground mb-3 leading-snug">
                    {req.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        req.status === 'requested' ? 'bg-orange-light text-orange' : 
                        req.status === 'installed' ? 'bg-primary-light text-primary' : 'bg-blue-light text-blue'
                      }`}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-foreground-muted group-hover:text-primary transition-colors">
                      Action Required <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar Mockup for engagement */}
              <div className="h-1 bg-surface w-full">
                <div 
                  className="h-full bg-orange transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (req.upvote_count || 0) * 10)}%` }} 
                />
              </div>
            </div>
          ))
        )}
      </main>

      {/* Floating Action Hint */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 pointer-events-none">
        <div className="bg-foreground text-white px-6 py-3 rounded-full shadow-strong flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest">Live Response Mode</span>
          </div>
          <button 
            onClick={() => navigate('/transparency')}
            className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"
          >
            Public Board <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
