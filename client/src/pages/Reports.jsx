import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import api from '../lib/api';
import { fmt } from '../lib/utils';
import toast from 'react-hot-toast';

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-3xl animate-bounce">📊</div></div>;

  const herd = data?.herd || {};
  const finance = data?.finance || {};
  const monthly = (data?.monthly_chart || []).map(d => ({
    month: format(parseISO(d.month), 'MMM yy'),
    income: parseFloat(d.income),
    spend: parseFloat(d.spend),
    profit: parseFloat(d.income) - parseFloat(d.spend),
  }));

  const herdPie = [
    { name: 'Bucks', value: parseInt(herd.total_bucks || 0) },
    { name: 'Does', value: parseInt(herd.total_does || 0) },
  ].filter(x => x.value > 0);

  const financePie = [
    { name: 'Income', value: parseFloat(finance.total_income || 0) },
    { name: 'Expenses', value: parseFloat(finance.total_spend || 0) },
  ].filter(x => x.value > 0);

  const profit = parseFloat(finance.net_profit || 0);
  const roi = finance.total_spend > 0 ? ((profit / finance.total_spend) * 100).toFixed(1) : 0;

  return (
    <div className="px-4 pb-6 animate-fade-in">
      <div className="pt-5 pb-4">
        <h1 className="page-title">Reports</h1>
        <p className="text-xs text-slate-500 mt-0.5">Farm performance overview</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card p-4">
          <p className="text-xs text-slate-500 mb-1">Total Active</p>
          <p className="text-2xl font-extrabold text-gold-400">{herd.total_active || 0}</p>
          <p className="text-xs text-slate-500 mt-1">goats in herd</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 mb-1">Net Profit</p>
          <p className={`text-2xl font-extrabold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt.currency(Math.abs(profit))}</p>
          <p className="text-xs text-slate-500 mt-1">{profit >= 0 ? 'profit' : 'loss'} all-time</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 mb-1">Total Income</p>
          <p className="text-xl font-bold text-emerald-400">{fmt.currency(finance.total_income)}</p>
          <p className="text-xs text-slate-500 mt-1">{finance.sell_count || 0} sales</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 mb-1">ROI</p>
          <p className={`text-xl font-bold ${roi >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{roi}%</p>
          <p className="text-xs text-slate-500 mt-1">return on investment</p>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      {monthly.length > 0 && (
        <>
          <p className="section-title">Monthly Performance</p>
          <div className="card p-4 mb-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthly} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px' }} />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="spend" fill="#ef4444" radius={[4, 4, 0, 0]} name="Spend" />
                <Bar dataKey="profit" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Profit" />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              <span className="flex items-center gap-1 text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Income</span>
              <span className="flex items-center gap-1 text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Spend</span>
              <span className="flex items-center gap-1 text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-gold-400 inline-block" />Profit</span>
            </div>
          </div>
        </>
      )}

      {/* Pie charts */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {herdPie.length > 0 && (
          <div className="card p-3">
            <p className="section-title text-center">Herd Gender</p>
            <PieChart width={140} height={100}>
              <Pie data={herdPie} cx={70} cy={45} innerRadius={28} outerRadius={42} dataKey="value" paddingAngle={3}>
                {herdPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }} />
            </PieChart>
            <div className="flex flex-col gap-1 mt-1">
              {herdPie.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-slate-400"><span className="w-2 h-2 rounded-full inline-block" style={{ background: COLORS[i] }} />{d.name}</span>
                  <span className="text-xs font-medium text-slate-200">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {financePie.length > 0 && (
          <div className="card p-3">
            <p className="section-title text-center">Finance Split</p>
            <PieChart width={140} height={100}>
              <Pie data={financePie} cx={70} cy={45} innerRadius={28} outerRadius={42} dataKey="value" paddingAngle={3}>
                <Cell fill="#10b981" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }} formatter={v => fmt.currency(v)} />
            </PieChart>
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Income</span>
                <span className="text-xs font-medium text-slate-200">{fmt.currency(finance.total_income)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Spend</span>
                <span className="text-xs font-medium text-slate-200">{fmt.currency(finance.total_spend)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Text summary */}
      <div className="card p-4">
        <p className="section-title">Farm Summary</p>
        <div className="flex flex-col gap-3 text-sm">
          <Row label="Active herd" value={`${herd.total_active || 0} goats`} />
          <Row label="Avg weight" value={herd.avg_weight ? fmt.weight(herd.avg_weight) : '—'} />
          <Row label="All-time sales" value={`${finance.sell_count || 0} transactions`} />
          <Row label="All-time purchases" value={`${finance.buy_count || 0} transactions`} />
          <Row label="Total revenue" value={fmt.currency(finance.total_income)} color="text-emerald-400" />
          <Row label="Total expenditure" value={fmt.currency(finance.total_spend)} color="text-red-400" />
          <div className="border-t border-slate-800 pt-3">
            <Row label="NET PROFIT" value={fmt.currency(Math.abs(profit))} color={profit >= 0 ? 'text-emerald-400' : 'text-red-400'} bold />
            <Row label="ROI" value={`${roi}%`} color={roi >= 0 ? 'text-blue-400' : 'text-red-400'} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, color = 'text-slate-200', bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500 text-sm">{label}</span>
      <span className={`${color} ${bold ? 'font-bold text-base' : 'font-medium'}`}>{value}</span>
    </div>
  );
}
