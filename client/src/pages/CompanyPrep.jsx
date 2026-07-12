import { useEffect, useState } from 'react';
import { Clock, Lock } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const CATEGORIES = ['MNC', 'Service-based', 'Product-based', 'FAANG', 'Startup'];

export default function CompanyPrep() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/companies${category ? `?category=${category}` : ''}`)
      .then((data) => setCompanies(data.companies))
      .catch((err) => setError(err.message));
  }, [category]);

  async function openCompany(company) {
    setSelected(company);
    setLocked(false);
    setError('');
    try {
      const data = await api.get(`/companies/${company._id}/questions`);
      setQuestions(data.questions);
    } catch (err) {
      if (err.code === 'TRIAL_EXPIRED') {
        setLocked(true);
        setQuestions([]);
      } else {
        setError(err.message);
      }
    }
  }

  const trialEnd = user ? new Date(new Date(user.trialStartedAt).getTime() + 7 * 24 * 60 * 60 * 1000) : null;
  const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <div className="main">
      <p className="muted" style={{ marginBottom: 16 }}>Interview questions organized by company and category.</p>
      <div className="banner">
        <Clock aria-hidden="true" />
        {daysLeft > 0
          ? `Trial active — ${daysLeft} day${daysLeft === 1 ? '' : 's'} left. After that, this section requires a subscription.`
          : 'Your trial has ended. Subscribe to keep access to company prep.'}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className={`btn ${category === '' ? 'gold' : 'secondary'}`} onClick={() => setCategory('')}>All</button>
        {CATEGORIES.map((c) => (
          <button key={c} className={`btn ${category === c ? 'gold' : 'secondary'}`} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>

      <div className="grid grid-2">
        <div>
          {companies.map((c) => (
            <div
              className={`card clickable${selected?._id === c._id ? ' raised' : ''}`}
              key={c._id}
              onClick={() => openCompany(c)}
            >
              <div style={{ fontWeight: 600 }}>{c.name}</div>
              <div className="muted">{c.category}</div>
            </div>
          ))}
        </div>

        <div>
          {error && <p className="error-text">{error}</p>}
          {!selected && <p className="muted">Select a company to see its questions.</p>}
          {selected && locked && (
            <div className="banner danger">
              <Lock aria-hidden="true" />
              Company prep for {selected.name} is locked. <a href="/subscription">Subscribe to unlock.</a>
            </div>
          )}
          {selected && !locked && (
            <>
              <h3>{selected.name}</h3>
              {questions.map((q) => (
                <div className="card" key={q._id}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className="pill muted">{q.type}</span>
                    {q.source === 'ai_generated' && <span className="pill gold">AI-generated</span>}
                  </div>
                  <p style={{ marginTop: 8 }}>{q.content}</p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
