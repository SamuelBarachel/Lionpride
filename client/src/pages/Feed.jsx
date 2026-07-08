import { useState, useEffect } from 'react';
import api from '../lib/api';
import { fmt } from '../lib/utils';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';

const FEED_TYPES = ['Hay', 'Grass', 'Silage', 'Grain mix', 'Maize bran', 'Cotton seed cake', 'Lucerne', 'Mineral supplement', 'Salt lick', 'Other'];

export default function FeedPage() {
  const [data, setData] = useState({ records: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ record_date: new Date().toISOString().split('T')[0], feed_type: '', quantity: '', unit: 'kg', cost: '', supplier: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get('/feed')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load feed records'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  const set = k => e => setForm(f => ({...f, [k]: e.target.value}));

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/feed', { ...form, quantity: form.quantity ? parseFloat(form.quantity) : undefined, cost: form.cost ? parseFloat(form.cost) : undefined });
      toast.success('Feed log added!');
      setModal(false);
      setForm({ record_date: new Date().toISOString().split('T')[0], feed_type: '', quantity: '', unit: 'kg', cost: '', supplier: '', notes: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const del = async id => {
    if (!confirm('Delete this record?')) return;
    try { await api.delete(`/feed/${id}`); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  return (
    <div className="px-4 pb-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Feed Logs</h1>
          <p className="text-xs text-slate-500 mt-0.5">Monthly cost: {fmt.currency(data.summary.total_cost)}</p>
        </div>
        <button onClick={() => setModal(true)} className="w-10 h-10 rounded-xl bg-gold-500 flex items-center justify-center">
          <Plus size={20} className="text-slate-950" />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="card p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">Total Feed Cost</p>
          <p className="text-lg font-bold text-gold-400">{fmt.currency(data.summary.total_cost)}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">Log Entries</p>
          <p className="text-lg font-bold text-slate-200">{data.summary.count || 0}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">{[1,2,3].map(i => <div key={i} className="card h-16 animate-pulse" />)}</div>
      ) : data.records.length === 0 ? (
        <EmptyState icon="🌾" title="No feed logs" description="Start tracking your feed costs." action={<button onClick={() => setModal(true)} className="btn-primary"><Plus size={16} />Add Log</button>} />
      ) : (
        <div className="flex flex-col gap-2">
          {data.records.map(r => (
            <div key={r.id} className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center text-xl flex-shrink-0">🌾</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200">{r.feed_type}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500">{fmt.date(r.record_date)}</span>
                  {r.quantity && <span className="text-xs text-slate-500">· {r.quantity} {r.unit}</span>}
                  {r.supplier && <span className="text-xs text-slate-600">· {r.supplier}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {r.cost && <span className="text-sm font-bold text-gold-400">{fmt.currency(r.cost)}</span>}
                <button onClick={() => del(r.id)} className="w-7 h-7 rounded-lg hover:bg-red-900/30 flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Log Feed">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="label">Feed Type *</label>
            <select className="input-field" value={form.feed_type} onChange={set('feed_type')} required>
              <option value="">Select feed type</option>
              {FEED_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div><label className="label">Date *</label><input className="input-field" type="date" value={form.record_date} onChange={set('record_date')} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Quantity</label><input className="input-field" type="number" step="0.1" placeholder="e.g. 50" value={form.quantity} onChange={set('quantity')} /></div>
            <div>
              <label className="label">Unit</label>
              <select className="input-field" value={form.unit} onChange={set('unit')}>
                {['kg', 'g', 'bales', 'bags', 'litres', 'tonnes'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Cost ($)</label><input className="input-field" type="number" step="0.01" placeholder="0.00" value={form.cost} onChange={set('cost')} /></div>
          <div><label className="label">Supplier</label><input className="input-field" placeholder="e.g. AgriStore" value={form.supplier} onChange={set('supplier')} /></div>
          <div><label className="label">Notes</label><textarea className="input-field min-h-[60px] resize-none" value={form.notes} onChange={set('notes')} /></div>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : '🌾 Add Feed Log'}</button>
        </form>
      </Modal>
    </div>
  );
}
