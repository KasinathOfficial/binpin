import { useState, useEffect } from 'react';
import { databases, client } from '../lib/appwrite';
import type { Bin, Comment, Feedback, PageView } from '../lib/appwrite';
import { Query } from 'appwrite';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import AdminLayout from './AdminLayout';
import { MapPin, MessageSquare, Heart, AlertTriangle, Users, TrendingUp, Activity } from 'lucide-react';

const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const binsId = import.meta.env.VITE_APPWRITE_BINS_COLLECTION_ID;
const commentsId = import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID;
const feedbackId = import.meta.env.VITE_APPWRITE_FEEDBACK_COLLECTION_ID;
const viewsId = import.meta.env.VITE_APPWRITE_VIEWS_COLLECTION_ID;

export default function AdminDashboard() {
  const [bins, setBins] = useState<Bin[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [views, setViews] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveIndicator, setLiveIndicator] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Comprehensive real-time subscription for all stats
  useEffect(() => {
    if (!dbId || !binsId || !commentsId || !feedbackId || !viewsId) return;

    const channels = [
      `databases.${dbId}.collections.${binsId}.documents`,
      `databases.${dbId}.collections.${commentsId}.documents`,
      `databases.${dbId}.collections.${feedbackId}.documents`,
      `databases.${dbId}.collections.${viewsId}.documents`
    ];

    const unsub = client.subscribe(channels, (response) => {
      const payload = response.payload as any;
      const id = payload.$id;
      const isBin = response.channels.some(c => c.includes(binsId));
      const isComment = response.channels.some(c => c.includes(commentsId));
      const isFeedback = response.channels.some(c => c.includes(feedbackId));
      const isView = response.channels.some(c => c.includes(viewsId));

      // Pulse live indicator
      setLiveIndicator(true);
      setTimeout(() => setLiveIndicator(false), 2000);

      if (isBin) {
        const mappedBin = { ...payload, id, created_at: payload.$createdAt } as unknown as Bin;
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          setBins(prev => [mappedBin, ...prev]);
        } else if (response.events.includes('databases.*.collections.*.documents.*.update')) {
          setBins(prev => prev.map(b => b.id === id ? mappedBin : b));
        } else if (response.events.includes('databases.*.collections.*.documents.*.delete')) {
          setBins(prev => prev.filter(b => b.id !== id));
        }
      } else if (isComment) {
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          setComments(prev => [{ ...payload, id, created_at: payload.$createdAt } as unknown as Comment, ...prev]);
        }
      } else if (isFeedback) {
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          setFeedback(prev => [{ ...payload, id, created_at: payload.$createdAt } as unknown as Feedback, ...prev]);
        }
      } else if (isView) {
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          setViews(prev => [{ ...payload, id, created_at: payload.$createdAt } as unknown as PageView, ...prev]);
        }
      }
    });

    return () => unsub();
  }, []);

  const fetchData = async () => {
    if (!dbId || !binsId || !commentsId || !feedbackId || !viewsId) return;
    try {
      const [b, c, f, v] = await Promise.all([
        databases.listDocuments(dbId, binsId, [Query.orderDesc('$createdAt'), Query.limit(200)]),
        databases.listDocuments(dbId, commentsId, [Query.orderDesc('$createdAt'), Query.limit(100)]),
        databases.listDocuments(dbId, feedbackId, [Query.orderDesc('$createdAt'), Query.limit(100)]),
        databases.listDocuments(dbId, viewsId, [Query.orderDesc('$createdAt'), Query.limit(100)])
      ]);
      setBins(b.documents.map(d => ({ ...d, id: d.$id, created_at: d.$createdAt })) as unknown as Bin[]);
      setComments(c.documents.map(d => ({ ...d, id: d.$id, created_at: d.$createdAt })) as unknown as Comment[]);
      setFeedback(f.documents.map(d => ({ ...d, id: d.$id, created_at: d.$createdAt })) as unknown as Feedback[]);
      setViews(v.documents.map(d => ({ ...d, id: d.$id, created_at: d.$createdAt })) as unknown as PageView[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const activeBins = bins.filter(b => !b.is_deleted);

  const metricChartData = [
    { name: 'General',    value: bins.filter(b => b.type === 'general').length,    fill: '#1E8A4A' },
    { name: 'Recyclable', value: bins.filter(b => b.type === 'recyclable').length, fill: '#1967D2' },
    { name: 'Organic',    value: bins.filter(b => b.type === 'organic').length,    fill: '#F29900' },
    { name: 'Medical',    value: bins.filter(b => b.type === 'medical').length,    fill: '#D93025' },
  ];

  // Group views by date
  const viewsByDate = views.reduce((acc: any, v) => {
    const date = new Date(v.created_at).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const viewChartData = Object.keys(viewsByDate).map(date => ({
    date,
    views: viewsByDate[date]
  })).reverse().slice(-7);

  // Bins added per day (last 7 days)
  const binsByDate = bins.reduce((acc: any, b) => {
    const date = new Date(b.created_at).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});
  const binTrendData = Object.keys(binsByDate)
    .map(date => ({ date, bins: binsByDate[date] }))
    .reverse()
    .slice(-7);

  const stats = [
    {
      label: 'Active Bins',
      value: activeBins.length,
      icon: MapPin,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      live: true,
      sub: `+${bins.filter(b => {
        const d = new Date(b.created_at);
        return !isNaN(d.getTime()) && (Date.now() - d.getTime()) < 86400000;
      }).length} today`,
    },
    {
      label: 'Total Comments',
      value: comments.length,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      live: false,
      sub: 'community notes',
    },
    {
      label: 'App Feedback',
      value: feedback.length,
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-100',
      live: false,
      sub: `avg ${feedback.length ? (feedback.reduce((a, f) => a + f.rating, 0) / feedback.length).toFixed(1) : '—'} ★`,
    },
    {
      label: 'Reported Bins',
      value: bins.filter(b => b.report_count > 0).length,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      live: false,
      sub: 'needs review',
    },
  ];

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Overview</h1>
          <p className="text-slate-500 mt-1 font-medium">Global operations dashboard and analytics</p>
        </div>
        {/* Live status indicator */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
          <Activity className={`w-4 h-4 transition-colors ${liveIndicator ? 'text-emerald-500' : 'text-slate-300'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {liveIndicator ? <span className="text-emerald-500">Live Update</span> : 'System Online'}
          </span>
          <div className={`w-2 h-2 rounded-full transition-colors ${liveIndicator ? 'bg-emerald-500 animate-pulse' : 'bg-slate-200'}`} />
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-slate-900"></div>
        </div>
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className={`bg-white border ${stat.borderColor} p-6 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow`}>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
                    <div className="flex items-end gap-2 mt-1">
                      <h3 className="text-3xl font-black text-slate-900">{stat.value.toLocaleString()}</h3>
                      {stat.live && (
                        <span className="mb-1 text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 tracking-wider">
                          LIVE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 font-bold uppercase tracking-wider">{stat.sub}</p>
                  </div>
                  <div className={`p-4 ${stat.bgColor} rounded-2xl ${stat.color} border ${stat.borderColor}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bin type breakdown - prominent */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm mb-6">
            <h3 className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Bin Count by Type (Real-time)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {metricChartData.map(item => (
                <div key={item.name} className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center">
                  <div className="text-3xl font-black text-slate-900 mb-1">{item.value}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: item.fill }}>{item.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-8 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-900" /> Bin Distribution
              </h3>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricChartData}>
                    <XAxis dataKey="name" fontSize={10} fontWeight="bold" stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} fontWeight="bold" stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {metricChartData.map((entry, index) => (
                        <rect key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-8 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" /> Page Views Trend
              </h3>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={viewChartData}>
                    <XAxis dataKey="date" fontSize={10} fontWeight="bold" stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} fontWeight="bold" stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="views" stroke="#3b82f6" fill="url(#colorViews)" strokeWidth={3} />
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-6">Latest Feedback Activity</h3>
            <div className="divide-y divide-slate-100">
              {feedback.slice(0, 5).map(f => (
                <div key={f.id} className="py-4 flex items-center justify-between text-sm group">
                  <div className="flex items-center gap-4">
                    <span className="text-amber-600 font-black bg-amber-50 px-3 py-1 rounded-full border border-amber-100 text-[10px] tracking-tighter">
                      {f.rating} ★
                    </span>
                    <span className="text-slate-600 font-bold max-w-xs md:max-w-md truncate group-hover:text-slate-900 transition-colors">{f.message || 'No written response'}</span>
                  </div>
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ml-4">{new Date(f.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
