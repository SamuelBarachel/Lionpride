import { useState, useEffect } from 'react';
import api from '../lib/api';
import { fmt } from '../lib/utils';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';
import { Plus, ArrowDownLeft, ArrowUpRight, Trash2 } from 'lucide-react';

export default function Transactions() {
  const [data, setData] = useState({ transactions: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [goats, setGoats] = useState([]);
  const [form, setForm] = useState({ type: 'sell', goat_id: '', goat_tag: '', goat_name: '', amount: '', transaction_date: new Date().toISOString().split('T')[0], counterparty: '', payment_method: 'cash', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    const params = {};
    if (filter !== 'all') params.type = filter;
    api.get('/transactions', { params })
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load transactions'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);
  useEffect(() => { api.get('/goats', { params: { status: 'active' } }).then(r => setGoats(r.data)).catch(() => {}); }, []);

  const set = k => e => setForm(f => ({...f, [k]: e.target.value}));

  const onGoatSelect = e => {
    const g = goats.find(x => x.id === parseInt(e.target.value));
    setForm(f => ({ ...f, goat_id: e.target.value, goat_tag: g?.tag_number || '', goat_name: g?.name || '' }));
  };

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/transactions', { ...form, amount: parseFloat(form.amount), goat_id: form.goat_id || null });
      toast.success('Transaction recorded!');
      setModal(false);
      setForm({ type: 'sell', goat_id: '', goat_tag: '', goat_name: '', amount: '', transaction_date: new Date().toISOString().split('T')[0], counterparty: '', payment_method: 'cash', notes: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const del = async id => {
    if (!confirm('Delete this transaction?')) return;
    try { await api.delete(`/transactions/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const s = data.summary;
  const profit = parseFloat(s.total_earned || 0) - parseFloat(s.total_spent || 0);

  return (
    <div className="px-4 pb-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="text-xs text-slate-500 mt-0.5">{s.count || 0} records</p>
        </div>
        <button onClick={() => setModal(true)} className="w-10 h-10 rounded-xl bg-gold-500 flex items-center justify-center shadow-lg shadow-gold-500/25">
          <Plus size={20} className="text-slate-950" />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="card p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">Income</p>
          <p className="text-sm font-bold text-emerald-400">{fmt.currency(s.total_earned)}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">Spent</p>
          <p className="text-sm font-bold text-red-400">{fmt.currency(s.total_spent)}</p>
        </div>
        <div className={`card p-3 text-center ${profit >= 0 ? 'border-emerald-800/30' : 'border-red-800/30'}`}>
          <p className="text-xs text-slate-500 mb-1">Profit</p>
          <p className={`text-sm font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt.currency(Math.abs(profit))}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['all', 'sell', 'buy'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-gold-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
            {f === 'all' ? 'All' : f === 'sell' ? '💰 Sales' : '🛒 Purchases'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-3">{[1,2,3].map(i => <div key={i} className="card h-16 animate-pulse" />)}</div>
      ) : data.transactions.length === 0 ? (
        <EmptyState icon="💸" title="No transactions" description="Log your first buy or sell." action={<button onClick={() => setModal(true)} className="btn-primary"><Plus size={16} /> Record Transaction</button>} />
      ) : (
        <div className="flex flex-col gap-2">
          {data.transactions.map(t => (
            <div key={t.id} className="card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${t.type === 'sell' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {t.type === 'sell' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">
                  {t.goat_name ? `${t.goat_name}` : t.type === 'sell' ? 'Sale' : 'Purchase'}
                  {t.goat_tag && <span className="text-slate-500 font-normal"> #{t.goat_tag}</span>}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500">{fmt.date(t.transaction_date)}</span>
                  {t.counterparty && <span className="text-xs text-slate-600">· {t.counterparty}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-base font-bold ${t.type === 'sell' ? 'text-emerald-400' : 'text-red-400'}`}>{t.type === 'sell' ? '+' : '-'}{fmt.currency(t.amount)}</span>
                <button onClick={() => del(t.id)} className="w-7 h-7 rounded-lg hover:bg-red-900/30 flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Record Transaction">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="label">Transaction Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {['sell', 'buy'].map(t => (
                <button key={t} type="button" onClick={() => setForm(f => ({...f, type: t}))}
                  className={`py-3 rounded-xl border font-semibold capitalize transition-all ${form.type === t ? (t === 'sell' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-red-500 border-red-500 text-white') : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                  {t === 'sell' ? '💰 Sell' : '🛒 Buy'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Linked Goat (optional)</label>
            <select className="input-field" value={form.goat_id} onChange={onGoatSelect}>
              <option value="">None / General</option>
              {goats.map(g => <option key={g.id} value={g.id}>{g.name || g.tag_number} (#{g.tag_number})</option>)}
            </select>
          </div>
          {!form.goat_id && (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Goat Tag</label><input className="input-field" placeholder="e.g. LP-005" value={form.goat_tag} onChange={set('goat_tag')} /></div>
              <div><label className="label">Goat Name</label><input className="input-field" placeholder="Optional" value={form.goat_name} onChange={set('goat_name')} /></div>
            </div>
          )}
          <div><label className="label">Amount ($) *</label><input className="input-field" type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={set('amount')} required /></div>
          <div><label className="label">Date *</label><input className="input-field" type="date" value={form.transaction_date} onChange={set('transaction_date')} required /></div>
          <div><label className="label">{form.type === 'sell' ? 'Buyer' : 'Seller'}</label><input className="input-field" placeholder="Name / Company" value={form.counterparty} onChange={set('counterparty')} /></div>
          <div>
            <label className="label">Payment Method</label>
            <select className="input-field" value={form.payment_method} onChange={set('payment_method')}>
              {['cash', 'bank transfer', 'mobile money', 'cheque', 'other'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div><label className="label">Notes</label><textarea className="input-field min-h-[60px] resize-none" placeholder="Any notes…" value={form.notes} onChange={set('notes')} /></div>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Record Transaction'}</button>
        </form>
      </Modal>
    </div>
  );
}
