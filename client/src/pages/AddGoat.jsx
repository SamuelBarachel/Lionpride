import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';

const BREEDS = ['Boer', 'Kalahari Red', 'Savanna', 'Nubian', 'Alpine', 'Toggenburg', 'Saanen', 'Local mixed', 'Other'];

export default function AddGoat() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [goats, setGoats] = useState([]);
  const [form, setForm] = useState({
    tag_number: '', name: '', breed: '', gender: '', date_of_birth: '', purchase_date: '',
    purchase_price: '', current_weight: '', color: '', notes: '', parent_id: '', status: 'active',
  });

  useEffect(() => {
    api.get('/goats', { params: { status: 'active' } }).then(r => setGoats(r.data)).catch(() => {});
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (!form.gender) return toast.error('Please select a gender');
    setLoading(true);
    try {
      const payload = { ...form };
      ['purchase_price', 'current_weight'].forEach(k => { if (payload[k]) payload[k] = parseFloat(payload[k]); else delete payload[k]; });
      ['date_of_birth', 'purchase_date'].forEach(k => { if (!payload[k]) delete payload[k]; });
      if (!payload.parent_id) delete payload.parent_id;
      await api.post('/goats', payload);
      toast.success('Goat added to herd!');
      navigate('/herd');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add goat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 pb-8">
      <div className="pt-5 pb-6">
        <h1 className="page-title">Add New Goat</h1>
        <p className="text-sm text-slate-500 mt-1">Register a goat in your herd</p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-5">
        {/* Identification */}
        <div>
          <p className="section-title">Identification</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="label">Tag Number *</label>
              <input className="input-field" placeholder="e.g. LP-001" value={form.tag_number} onChange={set('tag_number')} required />
            </div>
            <div>
              <label className="label">Name</label>
              <input className="input-field" placeholder="e.g. Simba" value={form.name} onChange={set('name')} />
            </div>
          </div>
        </div>

        {/* Details */}
        <div>
          <p className="section-title">Details</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="label">Gender *</label>
              <div className="grid grid-cols-2 gap-2">
                {['male', 'female'].map(g => (
                  <button key={g} type="button" onClick={() => setForm(f => ({...f, gender: g}))}
                    className={`py-3 rounded-xl border font-medium capitalize transition-all ${form.gender === g ? 'bg-gold-500 border-gold-500 text-slate-950' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                    {g === 'male' ? '🐐 Buck' : '🐑 Doe'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Breed</label>
              <select className="input-field" value={form.breed} onChange={set('breed')}>
                <option value="">Select breed</option>
                {BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Color / Markings</label>
                <input className="input-field" placeholder="e.g. Brown & white" value={form.color} onChange={set('color')} />
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input-field" value={form.status} onChange={set('status')}>
                  <option value="active">Active</option>
                  <option value="sold">Sold</option>
                  <option value="deceased">Deceased</option>
                  <option value="transferred">Transferred</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input className="input-field" type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
            </div>
          </div>
        </div>

        {/* Purchase Info */}
        <div>
          <p className="section-title">Purchase Info</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="label">Purchase Date</label>
              <input className="input-field" type="date" value={form.purchase_date} onChange={set('purchase_date')} />
            </div>
            <div>
              <label className="label">Purchase Price ($)</label>
              <input className="input-field" type="number" step="0.01" placeholder="0.00" value={form.purchase_price} onChange={set('purchase_price')} />
            </div>
          </div>
        </div>

        {/* Health & Weight */}
        <div>
          <p className="section-title">Current Stats</p>
          <div>
            <label className="label">Current Weight (kg)</label>
            <input className="input-field" type="number" step="0.1" placeholder="e.g. 35.5" value={form.current_weight} onChange={set('current_weight')} />
          </div>
        </div>

        {/* Lineage */}
        {goats.length > 0 && (
          <div>
            <p className="section-title">Lineage (optional)</p>
            <div>
              <label className="label">Dam / Sire</label>
              <select className="input-field" value={form.parent_id} onChange={set('parent_id')}>
                <option value="">None / Unknown</option>
                {goats.map(g => <option key={g.id} value={g.id}>{g.name || g.tag_number} ({g.gender})</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="label">Notes</label>
          <textarea className="input-field min-h-[80px] resize-none" placeholder="Any additional notes…" value={form.notes} onChange={set('notes')} />
        </div>

        <button type="submit" disabled={loading} className="btn-primary h-13 text-base mt-2">
          {loading ? <span className="animate-pulse">Saving…</span> : <><Save size={18} /> Add to Herd</>}
        </button>
      </form>
    </div>
  );
}
