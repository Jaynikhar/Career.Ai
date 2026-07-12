import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-split">
      <div className="auth-side">
        <div className="auth-side-mark">Career AI</div>
        <div className="auth-side-quote">Prep with the companies you're targeting, track every application, and let the AI agent handle the busywork.</div>
        <div className="auth-side-sub">Company-wise interview questions, a live job board, and resume tailoring — one place to run your search.</div>
      </div>
      <div className="auth-form-side" style={{ position: 'relative' }}>
        <button className="theme-toggle auth-toggle-theme" style={{ width: 'auto' }} onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
        </button>
        <div className="auth-card">
          <h2>Log in</h2>
          <p className="muted" style={{ marginBottom: 20 }}>Welcome back — pick up where you left off.</p>
          {error && <p className="error-text">{error}</p>}
          <form onSubmit={handleSubmit}>
            <label>Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <label>Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button className="btn gold" style={{ width: '100%' }} disabled={busy}>
              {busy ? 'Logging in...' : 'Log in'}
            </button>
          </form>
          <p className="muted" style={{ marginTop: 16 }}>
            No account yet? <Link to="/signup">Sign up</Link>
          </p>
          <p className="muted">Seeded admin: admin@careerprep.dev / AdminPass123</p>
        </div>
      </div>
    </div>
  );
}
