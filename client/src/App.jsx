import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Herd from './pages/Herd';
import GoatDetail from './pages/GoatDetail';
import AddGoat from './pages/AddGoat';
import Transactions from './pages/Transactions';
import HealthPage from './pages/Health';
import FeedPage from './pages/Feed';
import AIChat from './pages/AIChat';
import Reports from './pages/Reports';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <span className="text-5xl animate-bounce">🦁</span>
        <p className="text-gold-400 font-semibold tracking-wide">LIONPRIDE</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="herd" element={<Herd />} />
        <Route path="herd/add" element={<AddGoat />} />
        <Route path="herd/:id" element={<GoatDetail />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="health" element={<HealthPage />} />
        <Route path="feed" element={<FeedPage />} />
        <Route path="reports" element={<Reports />} />
        <Route path="ai" element={<AIChat />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
