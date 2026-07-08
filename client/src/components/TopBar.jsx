import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, ChevronLeft } from 'lucide-react';

const titles = {
  '/dashboard': 'Dashboard',
  '/herd': 'My Herd',
  '/herd/add': 'Add Goat',
  '/transactions': 'Transactions',
  '/health': 'Health Records',
  '/feed': 'Feed Logs',
  '/reports': 'Reports',
  '/ai': 'LionAI Assistant',
};

export default function TopBar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const title = titles[path] || (path.startsWith('/herd/') ? 'Goat Details' : 'Lionpride');
  const showBack = path !== '/dashboard' && path !== '/herd' && path !== '/transactions' &&
                   path !== '/health' && path !== '/feed' && path !== '/reports' && path !== '/ai';

  return (
    <header className="bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/50 sticky top-0 z-50 safe-top">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 transition-colors">
              <ChevronLeft size={20} className="text-slate-400" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-2xl">🦁</span>
              <span className="font-bold text-gold-400 tracking-wider text-sm">LIONPRIDE</span>
            </div>
          )}
          {showBack && <h1 className="font-semibold text-slate-100">{title}</h1>}
        </div>
        <div className="flex items-center gap-2">
          {!showBack && (
            <span className="text-sm text-slate-400 font-medium truncate max-w-28">
              {user?.full_name || user?.username}
            </span>
          )}
          <button
            onClick={logout}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-500 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
