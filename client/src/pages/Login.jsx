import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const r = await api.post('/auth/login', { login: form.username, password: form.password });
        login(r.data.token, r.data.user);
        navigate('/dashboard');
      } else {
        const r = await api.post('/auth/register', form);
        login(r.data.token, r.data.user);
        toast.success('Welcome to Lionpride!');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      {/* Hero branding */}
      <div className="mb-10 text-center animate-fade-in">
        <div className="text-7xl mb-4">🦁</div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">LIONPRIDE</h1>
        <p className="text-gold-400 text-sm font-medium mt-1 tracking-widest uppercase">Goat Management System</p>
        <p className="text-slate-500 text-xs mt-3">by Takwirira & Chirefu</p>
      </div>

      <div className="w-full max-w-sm animate-slide-up">
        {/* Mode toggle */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 mb-6">
          {['login', 'register'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all duration-200 ${
                mode === m ? 'bg-gold-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="label">Full Name</label>
                <input className="input-field" placeholder="Samuel Takwirira" value={form.full_name} onChange={set('full_name')} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input-field" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
              </div>
            </>
          )}
          <div>
            <label className="label">{mode === 'login' ? 'Username or Email' : 'Username'}</label>
            <input className="input-field" placeholder={mode === 'login' ? 'username or email' : 'Choose a username'} value={form.username} onChange={set('username')} required />
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                className="input-field pr-12"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                required
                minLength={6}
              />
              <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary mt-2 h-13 text-base">
            {loading ? (
              <span className="animate-pulse">Loading…</span>
            ) : mode === 'login' ? (
              <><LogIn size={18} /> Sign In</>
            ) : (
              <><UserPlus size={18} /> Create Account</>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <div className="h-px bg-slate-800 mb-4" />
          <p className="text-xs text-slate-600">🔒 Private system — authorised users only</p>
        </div>
      </div>
    </div>
  );
}
