import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import StatCard from '../components/StatCard';
import { fmt } from '../lib/utils';
import { Bell, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-3xl animate-bounce">🦁</div>
    </div>
  );

  const herd = data?.herd || {};
  const finance = data?.finance || {};
  const chartData = (data?.monthly_chart || []).map(d => ({
    month: format(parseISO(d.month), 'MMM'),
    income: parseFloat(d.income),
    spend: parseFloat(d.spend),
  }));

  const isProfit = parseFloat(finance.net_profit || 0) >= 0;

  return (
    <div className="px-4 pb-6 animate-fade-in">
      {/* Greeting */}
      <div className="pt-5 pb-4">
        <p className="text-slate-400 text-sm">Good day,</p>
        <h1 className="text-2xl font-bold text-white">{user?.full_name || user?.username} 🦁</h1>
        <p className="text-slate-500 text-xs mt-0.5">Lionpride Farm Overview</p>
      </div>

      {/* Net profit banner */}
      <div className={`rounded-2xl p-4 mb-5 border flex items-center justify-between ${isProfit ? 'bg-emerald-950/50 border-emerald-800/50' : 'bg-red-950/50 border-red-800/50'}`}>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-0.5">Net Profit</p>
          <p className={`text-3xl font-extrabold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
            {fmt.currency(Math.abs(finance.net_profit || 0))}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">All-time earnings</p>
        </div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isProfit ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
          {isProfit ? <TrendingUp size={28} className="text-emerald-400" /> : <TrendingDown size={28} className="text-red-400" />}
        </div>
      </div>

      {/* Herd stats */}
      <p className="section-title">Herd Summary</p>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard icon="🐐" label="Active Goats" value={fmt.number(herd.total_active)} sub={`${herd.total_bucks || 0} bucks · ${herd.total_does || 0} does`} color="gold" />
        <StatCard icon="💰" label="Total Sold" value={fmt.number(herd.total_sold)} sub="All time" color="blue" />
        <StatCard icon="📈" label="Total Income" value={fmt.currency(finance.total_income)} sub={`${finance.sell_count || 0} sales`} color="emerald" />
        <StatCard icon="📉" label="Total Spend" value={fmt.currency(finance.total_spend)} sub={`${finance.buy_count || 0} purchases`} color="red" />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <>
          <p className="section-title">Income vs Spend (6 months)</p>
          <div className="card p-4 mb-5">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="spend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#income)" strokeWidth={2} name="Income" />
                <Area type="monotone" dataKey="spend" stroke="#ef4444" fill="url(#spend)" strokeWidth={2} name="Spend" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Upcoming health alerts */}
      {data?.alerts?.length > 0 && (
        <>
          <p className="section-title flex items-center gap-1.5">
            <Bell size={12} className="text-gold-400" />
            Upcoming Health ({data.alerts.length})
          </p>
          <div className="flex flex-col gap-2 mb-5">
            {data.alerts.map(a => (
              <div key={a.id} className="card-inner p-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center text-sm flex-shrink-0">💉</div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{a.goat_name} <span className="text-slate-500 text-xs">#{a.tag_number}</span></p>
                  <p className="text-xs text-slate-400 mt-0.5">{a.record_type} — due {fmt.date(a.next_due_date)}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Recent goats */}
      {data?.recent_goats?.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="section-title mb-0">Recently Added</p>
            <button onClick={() => navigate('/herd')} className="text-xs text-gold-400 font-medium">View all →</button>
          </div>
          <div className="flex flex-col gap-2">
            {data.recent_goats.map(g => (
              <button
                key={g.id}
                onClick={() => navigate(`/herd/${g.id}`)}
                className="card p-3 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
              >
                <span className="text-2xl">{g.gender === 'male' ? '🐐' : '🐑'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{g.name || `Goat #${g.tag_number}`}</p>
                  <p className="text-xs text-slate-500 truncate">{g.breed || 'Unknown breed'} · {g.gender}</p>
                </div>
                <div className="text-xs font-medium px-2 py-1 rounded-lg bg-slate-800 text-slate-400">{g.current_weight ? fmt.weight(g.current_weight) : '—'}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/herd/add')} className="btn-primary">
          <Plus size={16} /> Add Goat
        </button>
        <button onClick={() => navigate('/transactions')} className="btn-secondary">
          📊 Log Sale
        </button>
      </div>
    </div>
  );
}
