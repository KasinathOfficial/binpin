import { useState, useEffect } from 'react';
import { databases } from '../lib/appwrite';
import type { Bin, Comment, Feedback, PageView } from '../lib/appwrite';
import { Query } from 'appwrite';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import AdminLayout from './AdminLayout';
import { MapPin, MessageSquare, Heart, AlertTriangle, Users } from 'lucide-react';

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!dbId || !binsId || !commentsId || !feedbackId || !viewsId) return;
    try {
      const [b, c, f, v] = await Promise.all([
        databases.listDocuments(dbId, binsId, [Query.orderDesc('$createdAt'), Query.limit(100)]),
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

  const metricChartData = [
    { name: 'General', value: bins.filter(b => b.type === 'general').length },
    { name: 'Recyclable', value: bins.filter(b => b.type === 'recyclable').length },
    { name: 'Organic', value: bins.filter(b => b.type === 'organic').length },
    { name: 'Medical', value: bins.filter(b => b.type === 'medical').length },
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

  const stats = [
    { label: 'Active Bins', value: bins.filter(b => !b.is_deleted).length, icon: MapPin, color: 'text-emerald-400' },
    { label: 'Total Comments', value: comments.length, icon: MessageSquare, color: 'text-blue-400' },
    { label: 'App Feedback', value: feedback.length, icon: Heart, color: 'text-pink-400' },
    { label: 'Reported Bins', value: bins.filter(b => b.report_count > 0).length, icon: AlertTriangle, color: 'text-amber-400' },
  ];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">System Overview</h1>
        <p className="text-slate-400 mt-1">Global operations dashboard and analytics</p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow-lg">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">{stat.label}</p>
                    <h3 className="text-3xl font-extrabold text-white mt-1">{stat.value}</h3>
                  </div>
                  <div className={`p-3 bg-slate-800 rounded-xl ${stat.color} border border-slate-700/50`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
              <h3 className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-6 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Bin Distribution by Type
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricChartData}>
                    <XAxis dataKey="name" fontSize={11} stroke="#64748b" tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} stroke="#64748b" tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: '#1e293b' }} 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f1f5f9' }}
                    />
                    <Bar dataKey="value" fill="#2BB55C" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
              <h3 className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-6 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" /> Platform Traffic (Page Views)
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={viewChartData}>
                    <XAxis dataKey="date" fontSize={11} stroke="#64748b" tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} stroke="#64748b" tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f1f5f9' }}
                    />
                    <Area type="monotone" dataKey="views" stroke="#3b82f6" fill="url(#colorViews)" strokeWidth={2} />
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Activity Mini Tables */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-4">Latest Platform Activity</h3>
            <div className="divide-y divide-slate-800">
              {feedback.slice(0, 5).map(f => (
                <div key={f.id} className="py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-amber-400 font-bold bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 text-xs flex items-center gap-1">
                      {f.rating} ★
                    </span>
                    <span className="text-slate-300 max-w-xs md:max-w-md truncate">{f.message || 'No written response'}</span>
                  </div>
                  <span className="text-slate-500 text-xs whitespace-nowrap ml-4">{new Date(f.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
