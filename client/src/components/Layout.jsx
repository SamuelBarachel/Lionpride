import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import TopBar from './TopBar';

export default function Layout() {
  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">
      <TopBar />
      <main className="flex-1 overflow-y-auto pb-nav">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
