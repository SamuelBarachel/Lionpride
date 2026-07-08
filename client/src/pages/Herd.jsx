import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import GoatCard from '../components/GoatCard';
import EmptyState from '../components/EmptyState';
import { Plus, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES = ['all', 'active', 'sold', 'deceased', 'transferred'];
const GENDERS = ['all', 'male', 'female'];

export default function Herd() {
  const [goats, setGoats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');
  const [gender, setGender] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const params = {};
    if (status !== 'all') params.status = status;
    if (gender !== 'all') params.gender = gender;
    if (search) params.search = search;

    const timer = setTimeout(() => {
      api.get('/goats', { params })
        .then(r => setGoats(r.data))
        .catch(() => toast.error('Failed to load herd'))
        .finally(() => setLoading(false));
    }, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [status, gender, search]);

  return (
    <div className="px-4 pb-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Herd</h1>
          <p className="text-xs text-slate-500 mt-0.5">{goats.length} goats found</p>
        </div>
        <button onClick={() => navigate('/herd/add')} className="w-10 h-10 rounded-xl bg-gold-500 flex items-center justify-center shadow-lg shadow-gold-500/25">
          <Plus size={20} className="text-slate-950" />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          className="input-field pl-10"
          placeholder="Search by name or tag…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <div className="flex items-center gap-1 flex-shrink-0">
          <Filter size={12} className="text-slate-500" />
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all ${status === s ? 'bg-gold-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 mb-5">
        {GENDERS.map(g => (
          <button
            key={g}
            onClick={() => setGender(g)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${gender === g ? 'bg-slate-700 text-slate-100' : 'bg-slate-800/50 text-slate-500'}`}
          >
            {g === 'all' ? 'All Genders' : g === 'male' ? '🐐 Bucks' : '🐑 Does'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => <div key={i} className="card h-24 animate-pulse" />)}
        </div>
      ) : goats.length === 0 ? (
        <EmptyState
          icon="🐐"
          title="No goats found"
          description={search ? 'Try a different search term.' : 'Start building your herd by adding your first goat.'}
          action={
            !search && (
              <button onClick={() => navigate('/herd/add')} className="btn-primary">
                <Plus size={16} /> Add First Goat
              </button>
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {goats.map(g => <GoatCard key={g.id} goat={g} />)}
        </div>
      )}
    </div>
  );
}
