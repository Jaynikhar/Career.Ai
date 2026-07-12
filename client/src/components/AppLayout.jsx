import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/companies': 'Company prep',
  '/jobs': 'Job board',
  '/ai-agent': 'AI agent',
  '/subscription': 'Subscription',
  '/admin': 'Admin'
};

export default function AppLayout() {
  const location = useLocation();
  const title = TITLES[location.pathname] || 'CareerPrep AI';

  return (
    <div className="app-with-nav">
      <Sidebar />
      <div className="content-area">
        <div className="topbar">
          <div className="topbar-title">{title}</div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
