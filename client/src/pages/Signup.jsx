import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Signup() {
  const { signup } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signup(name, email, password);
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
        <div className="auth-side-mark">CareerPrep AI</div>
        <div className="auth-side-quote">Seven days of full access to company prep, on us. See if it fits your search before you commit.</div>
        <div className="auth-side-sub">No card required to start the trial.</div>
      </div>
      <div className="auth-form-side" style={{ position: 'relative' }}>
        <button className="theme-toggle auth-toggle-theme" style={{ width: 'auto' }} onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
        </button>
        <div className="auth-card">
          <h2>Create your account</h2>
          <p className="muted" style={{ marginBottom: 20 }}>Starts a 7-day free trial of company prep content.</p>
          {error && <p className="error-text">{error}</p>}
          <form onSubmit={handleSubmit}>
            <label>Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            <label>Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <label>Password</label>
            <input className="input" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button className="btn gold" style={{ width: '100%' }} disabled={busy}>
              {busy ? 'Creating account...' : 'Sign up'}
            </button>
          </form>
          <p className="muted" style={{ marginTop: 16 }}>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
