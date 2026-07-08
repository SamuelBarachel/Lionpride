import { useNavigate } from 'react-router-dom';
import { Weight, Calendar } from 'lucide-react';
import { fmt, statusColors, genderColors, goatEmoji } from '../lib/utils';

export default function GoatCard({ goat }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/herd/${goat.id}`)}
      className="card p-4 flex items-start gap-3 w-full text-left active:scale-[0.98] transition-transform duration-100"
    >
      <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0">
        {goatEmoji(goat.gender)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <p className="font-semibold text-slate-100 leading-tight">{goat.name || `Goat #${goat.tag_number}`}</p>
            <p className="text-xs text-slate-500 mt-0.5">#{goat.tag_number}</p>
          </div>
          <span className={statusColors[goat.status] || 'badge bg-slate-800 text-slate-400'}>{goat.status}</span>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span className={genderColors[goat.gender]}>{goat.gender}</span>
          {goat.breed && <span className="text-xs text-slate-500">{goat.breed}</span>}
        </div>
        <div className="flex items-center gap-4 mt-2">
          {goat.current_weight && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Weight size={11} /> {fmt.weight(goat.current_weight)}
            </span>
          )}
          {goat.date_of_birth && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Calendar size={11} /> {fmt.date(goat.date_of_birth)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
