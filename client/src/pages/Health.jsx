import { useState, useEffect } from 'react';
import api from '../lib/api';
import { fmt } from '../lib/utils';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';
import { Plus, Bell } from 'lucide-react';

const TYPES = ['all', 'vaccination', 'deworming', 'treatment', 'checkup', 'injury', 'disease', 'other'];
const TYPE_ICONS = { vaccination: '💉', deworming: '🪱', treatment: '🩹', checkup: '🔍', injury: '🤕', disease: '🦠', other: '📋' };

export default function HealthPage() {
  const [records, setRecords] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('all');
  const [modal, setModal] = useState(false);
  const [goats, setGoats] = useState([]);
  const [form, setForm] = useState({ goat_id: '', record_date: new Date().toISOString().split('T')[0], record_type: 'vaccination', description: '', treatment: '', medication: '', cost: '', vet_name: '', next_due_date: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    const params = {};
    if (type !== 'all') params.type = type;
    Promise.all([
      api.get('/health', { params }),
      api.get('/health', { params: { upcoming: 'true' } }),
    ]).then(([r, u]) => { setRecords(r.data); setUpcoming(u.data); })
      .catch(() => toast.error('Failed to load health records'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [type]);
  useEffect(() => { api.get('/goats', { params: { status: 'active' } }).then(r => setGoats(r.data)).catch(() => {}); }, []);

  const set = k => e => setForm(f => ({...f, [k]: e.target.value}));

  const submit = async e => {
    e.preventDefault();
    if (!form.goat_id) return toast.error('Select a goat');
    setSaving(true);
    try {
      await api.post('/health', { ...form, goat_id: parseInt(form.goat_id), cost: form.cost ? parseFloat(form.cost) : undefined });
      toast.success('Health record added!');
      setModal(false);
      setForm({ goat_id: '', record_date: new Date().toISOString().split('T')[0], record_type: 'vaccination', description: '', treatment: '', medication: '', cost: '', vet_name: '', next_due_date: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setSaving(false); }
  };

  const del = async id => {
    if (!confirm('Delete this record?')) return;
    try { await api.delete(`/health/${id}`); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  return (
    <div className="px-4 pb-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Health Records</h1>
          <p className="text-xs text-slate-500 mt-0.5">{records.length} records</p>
        </div>
        <button onClick={() => setModal(true)} className="w-10 h-10 rounded-xl bg-gold-500 flex items-center justify-center shadow-lg shadow-gold-500/25">
          <Plus size={20} className="text-slate-950" />
        </button>
      </div>

      {/* Upcoming alerts */}
      {upcoming.length > 0 && (
        <div className="card border-gold-500/20 bg-gold-500/5 p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={14} className="text-gold-400" />
            <p className="text-sm font-semibold text-gold-400">Upcoming ({upcoming.length})</p>
          </div>
          <div className="flex flex-col gap-2">
            {upcoming.map(u => (
              <div key={u.id} className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-200">{u.goat_name}</span>
                  <span className="text-xs text-slate-500 ml-1">#{u.tag_number}</span>
                  <p className="text-xs text-slate-400 capitalize">{u.record_type}</p>
                </div>
                <span className="text-xs font-medium text-gold-400 bg-gold-500/10 px-2 py-1 rounded-lg">{fmt.date(u.next_due_date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Type filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {TYPES.map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all flex-shrink-0 ${type === t ? 'bg-gold-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
            {t !== 'all' && TYPE_ICONS[t]} {t}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-3">{[1,2,3].map(i => <div key={i} className="card h-20 animate-pulse" />)}</div>
      ) : records.length === 0 ? (
        <EmptyState icon="🏥" title="No health records" description="Start tracking your herd's health." action={<button onClick={() => setModal(true)} className="btn-primary"><Plus size={16} />Add Record</button>} />
      ) : (
        <div className="flex flex-col gap-2">
          {records.map(r => (
            <div key={r.id} className="card p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{TYPE_ICONS[r.record_type] || '📋'}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{r.goat_name} <span className="text-slate-500 font-normal text-xs">#{r.tag_number}</span></p>
                    <span className="text-xs text-gold-400 font-medium capitalize">{r.record_type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{fmt.date(r.record_date)}</span>
                  <button onClick={() => del(r.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors text-xs">✕</button>
                </div>
              </div>
              <p className="text-sm text-slate-300">{r.description}</p>
              {r.treatment && <p className="text-xs text-slate-500 mt-1">Treatment: {r.treatment}</p>}
              {r.medication && <p className="text-xs text-slate-500">Medication: {r.medication}</p>}
              <div className="flex gap-4 mt-2">
                {r.vet_name && <span className="text-xs text-slate-500">Dr. {r.vet_name}</span>}
                {r.cost && <span className="text-xs text-slate-500">Cost: {fmt.currency(r.cost)}</span>}
                {r.next_due_date && <span className="text-xs text-gold-500/80">Next: {fmt.date(r.next_due_date)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Add Health Record">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="label">Goat *</label>
            <select className="input-field" value={form.goat_id} onChange={set('goat_id')} required>
              <option value="">Select goat</option>
              {goats.map(g => <option key={g.id} value={g.id}>{g.name || g.tag_number} (#{g.tag_number})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Type *</label>
            <select className="input-field" value={form.record_type} onChange={set('record_type')}>
              {TYPES.filter(t => t !== 'all').map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>
          <div><label className="label">Date *</label><input className="input-field" type="date" value={form.record_date} onChange={set('record_date')} required /></div>
          <div><label className="label">Description *</label><textarea className="input-field min-h-[70px] resize-none" placeholder="What was done?" value={form.description} onChange={set('description')} required /></div>
          <div><label className="label">Treatment</label><input className="input-field" placeholder="e.g. Ivermectin injection" value={form.treatment} onChange={set('treatment')} /></div>
          <div><label className="label">Medication</label><input className="input-field" placeholder="e.g. Albendazole 5ml" value={form.medication} onChange={set('medication')} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Cost ($)</label><input className="input-field" type="number" step="0.01" placeholder="0.00" value={form.cost} onChange={set('cost')} /></div>
            <div><label className="label">Next Due</label><input className="input-field" type="date" value={form.next_due_date} onChange={set('next_due_date')} /></div>
          </div>
          <div><label className="label">Vet Name</label><input className="input-field" placeholder="e.g. Dr. Moyo" value={form.vet_name} onChange={set('vet_name')} /></div>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Add Record'}</button>
        </form>
      </Modal>
    </div>
  );
}
