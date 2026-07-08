export default function StatCard({ icon, label, value, sub, color = 'gold', trend }) {
  const colorMap = {
    gold: 'text-gold-400 bg-gold-500/10 border-gold-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  };

  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium uppercase tracking-wider ${colorMap[color].split(' ')[0]}`}>{label}</span>
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-lg ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-100 leading-tight">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
