import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Briefcase, Sparkles, CreditCard, ShieldCheck, Sun, Moon, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/companies', label: 'Company prep', icon: BookOpen },
  { to: '/jobs', label: 'Job board', icon: Briefcase },
  { to: '/ai-agent', label: 'AI agent', icon: Sparkles },
  { to: '/subscription', label: 'Subscription', icon: CreditCard }
];

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  if (!user) return null;

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <span className="mark">C</span>
        Career AI
      </div>

      <nav className="sidebar-nav">
        {LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <Icon aria-hidden="true" />
            {label}
          </NavLink>
        ))}
        {user.role === 'admin' && (
          <NavLink to="/admin" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <ShieldCheck aria-hidden="true" />
            Admin
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar">{initials(user.name)}</div>
          <div>
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-role">{user.role === 'admin' ? 'Admin' : 'Member'}</div>
          </div>
        </div>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        <button className="btn secondary" style={{ width: '100%', marginTop: 8 }} onClick={handleLogout}>
          <LogOut size={15} aria-hidden="true" />
          Log out
        </button>
      </div>
    </div>
  );
}
