import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { fmt, statusColors, genderColors } from '../lib/utils';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { Edit, Trash2, Plus, Weight, Calendar, Tag, Stethoscope } from 'lucide-react';

export default function GoatDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [goat, setGoat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [healthModal, setHealthModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [healthForm, setHealthForm] = useState({ record_date: new Date().toISOString().split('T')[0], record_type: 'vaccination', description: '', treatment: '', medication: '', cost: '', vet_name: '', next_due_date: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get(`/goats/${id}`)
      .then(r => { setGoat(r.data); setEditForm(r.data); })
      .catch(() => { toast.error('Goat not found'); navigate('/herd'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const saveEdit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/goats/${id}`, editForm);
      toast.success('Updated!');
      setEditModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally { setSaving(false); }
  };

  const addHealth = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/health', { ...healthForm, goat_id: parseInt(id) });
      toast.success('Health record added!');
      setHealthModal(false);
      setHealthForm({ record_date: new Date().toISOString().split('T')[0], record_type: 'vaccination', description: '', treatment: '', medication: '', cost: '', vet_name: '', next_due_date: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add record');
    } finally { setSaving(false); }
  };

  const deleteGoat = async () => {
    if (!confirm(`Delete ${goat.name || goat.tag_number}? This cannot be undone.`)) return;
    try {
      await api.delete(`/goats/${id}`);
      toast.success('Goat removed');
      navigate('/herd');
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-4xl animate-bounce">🐐</div></div>;
  if (!goat) return null;

  const set = k => e => setEditForm(f => ({...f, [k]: e.target.value}));
  const setH = k => e => setHealthForm(f => ({...f, [k]: e.target.value}));

  return (
    <div className="px-4 pb-8 animate-fade-in">
      {/* Hero */}
      <div className="pt-4 pb-5 flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-4xl flex-shrink-0">
          {goat.gender === 'male' ? '🐐' : '🐑'}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white truncate">{goat.name || `Goat #${goat.tag_number}`}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Tag #{goat.tag_number}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={statusColors[goat.status]}>{goat.status}</span>
            <span className={genderColors[goat.gender]}>{goat.gender}</span>
            {goat.breed && <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{goat.breed}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditModal(true)} className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-gold-400 transition-colors">
            <Edit size={16} />
          </button>
          <button onClick={deleteGoat} className="w-9 h-9 rounded-xl bg-red-900/30 flex items-center justify-center text-red-500 hover:text-red-400 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <InfoTile icon={<Weight size={14} />} label="Weight" value={fmt.weight(goat.current_weight)} />
        <InfoTile icon={<Calendar size={14} />} label="Date of Birth" value={fmt.date(goat.date_of_birth)} />
        <InfoTile icon="💰" label="Purchase Price" value={fmt.currency(goat.purchase_price)} />
        <InfoTile icon={<Calendar size={14} />} label="Purchased" value={fmt.date(goat.purchase_date)} />
        {goat.parent_name && (
          <InfoTile icon={<Tag size={14} />} label="Parent" value={`${goat.parent_name} #${goat.parent_tag}`} />
        )}
        {goat.color && (
          <InfoTile icon="🎨" label="Color" value={goat.color} />
        )}
      </div>

      {/* Notes */}
      {goat.notes && (
        <div className="card p-4 mb-5">
          <p className="section-title">Notes</p>
          <p className="text-sm text-slate-300 leading-relaxed">{goat.notes}</p>
        </div>
      )}

      {/* Offspring */}
      {goat.offspring?.length > 0 && (
        <div className="mb-5">
          <p className="section-title">Offspring ({goat.offspring.length})</p>
          <div className="flex flex-col gap-2">
            {goat.offspring.map(o => (
              <button key={o.id} onClick={() => navigate(`/herd/${o.id}`)} className="card-inner p-3 flex items-center gap-3 text-left">
                <span>{o.gender === 'male' ? '🐐' : '🐑'}</span>
                <div>
                  <p className="text-sm font-medium text-slate-200">{o.name || `#${o.tag_number}`}</p>
                  <p className="text-xs text-slate-500">{o.gender} · {o.status}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Health Records */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="section-title mb-0">Health Records ({goat.health_records?.length || 0})</p>
          <button onClick={() => setHealthModal(true)} className="flex items-center gap-1 text-xs text-gold-400 font-medium">
            <Plus size={12} /> Add
          </button>
        </div>
        {goat.health_records?.length === 0 ? (
          <div className="card-inner p-4 text-center">
            <p className="text-slate-500 text-sm">No health records yet</p>
            <button onClick={() => setHealthModal(true)} className="mt-2 text-xs text-gold-400">Add first record →</button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {goat.health_records.map(h => (
              <div key={h.id} className="card-inner p-3">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">💉</span>
                    <span className="text-xs font-semibold capitalize text-gold-400">{h.record_type}</span>
                  </div>
                  <span className="text-xs text-slate-500">{fmt.date(h.record_date)}</span>
                </div>
                <p className="text-sm text-slate-300">{h.description}</p>
                {h.treatment && <p className="text-xs text-slate-500 mt-1">Tx: {h.treatment}</p>}
                {h.next_due_date && <p className="text-xs text-gold-500/80 mt-1">Next due: {fmt.date(h.next_due_date)}</p>}
                <div className="flex gap-3 mt-1">
                  {h.vet_name && <span className="text-xs text-slate-500">Vet: {h.vet_name}</span>}
                  {h.cost && <span className="text-xs text-slate-500">Cost: {fmt.currency(h.cost)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weight history */}
      {goat.weight_records?.length > 0 && (
        <div className="mb-5">
          <p className="section-title">Weight History</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {goat.weight_records.map(w => (
              <div key={w.id} className="card-inner p-3 flex-shrink-0 text-center min-w-[80px]">
                <p className="text-base font-bold text-slate-200">{fmt.weight(w.weight)}</p>
                <p className="text-xs text-slate-500 mt-1">{fmt.dateShort(w.record_date)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Goat">
        <form onSubmit={saveEdit} className="flex flex-col gap-4">
          <div><label className="label">Tag Number</label><input className="input-field" value={editForm.tag_number || ''} onChange={set('tag_number')} /></div>
          <div><label className="label">Name</label><input className="input-field" value={editForm.name || ''} onChange={set('name')} /></div>
          <div><label className="label">Breed</label><input className="input-field" value={editForm.breed || ''} onChange={set('breed')} /></div>
          <div>
            <label className="label">Status</label>
            <select className="input-field" value={editForm.status || 'active'} onChange={set('status')}>
              <option value="active">Active</option>
              <option value="sold">Sold</option>
              <option value="deceased">Deceased</option>
              <option value="transferred">Transferred</option>
            </select>
          </div>
          <div><label className="label">Current Weight (kg)</label><input className="input-field" type="number" step="0.1" value={editForm.current_weight || ''} onChange={set('current_weight')} /></div>
          <div><label className="label">Notes</label><textarea className="input-field min-h-[60px] resize-none" value={editForm.notes || ''} onChange={set('notes')} /></div>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Changes'}</button>
        </form>
      </Modal>

      {/* Health Record Modal */}
      <Modal open={healthModal} onClose={() => setHealthModal(false)} title="Add Health Record">
        <form onSubmit={addHealth} className="flex flex-col gap-4">
          <div>
            <label className="label">Record Type *</label>
            <select className="input-field" value={healthForm.record_type} onChange={setH('record_type')}>
              {['vaccination', 'deworming', 'treatment', 'checkup', 'injury', 'disease', 'other'].map(t => (
                <option key={t} value={t} className="capitalize">{t}</option>
              ))}
            </select>
          </div>
          <div><label className="label">Date *</label><input className="input-field" type="date" value={healthForm.record_date} onChange={setH('record_date')} required /></div>
          <div><label className="label">Description *</label><textarea className="input-field min-h-[70px] resize-none" placeholder="What was done?" value={healthForm.description} onChange={setH('description')} required /></div>
          <div><label className="label">Treatment</label><input className="input-field" placeholder="e.g. Ivermectin injection" value={healthForm.treatment} onChange={setH('treatment')} /></div>
          <div><label className="label">Medication</label><input className="input-field" placeholder="e.g. Albendazole 5ml" value={healthForm.medication} onChange={setH('medication')} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Cost ($)</label><input className="input-field" type="number" step="0.01" placeholder="0.00" value={healthForm.cost} onChange={setH('cost')} /></div>
            <div><label className="label">Next Due</label><input className="input-field" type="date" value={healthForm.next_due_date} onChange={setH('next_due_date')} /></div>
          </div>
          <div><label className="label">Vet Name</label><input className="input-field" placeholder="e.g. Dr. Moyo" value={healthForm.vet_name} onChange={setH('vet_name')} /></div>
          <button type="submit" disabled={saving} className="btn-primary"><Stethoscope size={16} />{saving ? 'Saving…' : 'Add Record'}</button>
        </form>
      </Modal>
    </div>
  );
}

function InfoTile({ icon, label, value }) {
  return (
    <div className="card-inner p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-slate-500 text-xs flex items-center">{icon}</span>
        <span className="text-xs text-slate-500 font-medium">{label}</span>
      </div>
      <p className="text-sm font-semibold text-slate-200">{value || '—'}</p>
    </div>
  );
}
