import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Beef, ArrowLeftRight, Heart, Wheat, BarChart3, Bot } from 'lucide-react';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/herd', icon: Beef, label: 'Herd' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Finance' },
  { to: '/health', icon: Heart, label: 'Health' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/ai', icon: Bot, label: 'AI' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 safe-bottom">
      <div className="flex items-center justify-around px-1 h-16">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-150 min-w-0 ${
                isActive
                  ? 'text-gold-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-gold-500/15' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
