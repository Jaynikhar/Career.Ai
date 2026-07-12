import { useEffect, useState } from 'react';
import { RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { api } from '../api/client.js';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [subs, setSubs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const [ingestBusy, setIngestBusy] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
  const [ingestResult, setIngestResult] = useState(null);
  const [genResult, setGenResult] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [qCompanyId, setQCompanyId] = useState('');
  const [qType, setQType] = useState('Technical');
  const [qDifficulty, setQDifficulty] = useState('Medium');
  const [qContent, setQContent] = useState('');
  const [qBusy, setQBusy] = useState(false);
  const [knownCompanies, setKnownCompanies] = useState([]);
  const [quickCompany, setQuickCompany] = useState('');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickBusy, setQuickBusy] = useState(false);


  function loadAll() {
    api.get('/admin/analytics').then((d) => setAnalytics(d)).catch((e) => setError(e.message));
    api.get('/admin/users').then((d) => setUsers(d.users)).catch((e) => setError(e.message));
    api.get('/admin/subscriptions').then((d) => setSubs(d.subscriptions)).catch((e) => setError(e.message));
    api.get('/admin/questions').then((d) => setQuestions(d.questions)).catch((e) => setError(e.message));
    api.get('/admin/jobs').then((d) => setJobs(d.jobs)).catch((e) => setError(e.message));
    api.get('/admin/known-companies').then((d) => {
      setKnownCompanies(d.companies);
      if (d.companies[0]) setQuickCompany(d.companies[0].name);
    }).catch((e) => setError(e.message));
    api.get('/companies').then((d) => {
      setCompanies(d.companies);
      if (d.companies[0] && !qCompanyId) setQCompanyId(d.companies[0]._id);
    }).catch((e) => setError(e.message));
  }

  useEffect(loadAll, []);

  async function runJobIngest() {
    setIngestBusy(true);
    setError('');
    try {
      const result = await api.post('/admin/ingest/jobs', {});
      setIngestResult(result);
      loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setIngestBusy(false);
    }
  }

  async function quickAddJob(e) {
    e.preventDefault();
    if (!quickCompany || !quickTitle.trim()) return;
    const company = knownCompanies.find((c) => c.name === quickCompany);
    setQuickBusy(true);
    setError('');
    try {
      await api.post('/admin/jobs', {
        title: quickTitle.trim(),
        companyName: company.name,
        description: `Posted directly on ${company.name}'s official careers site. Click "View posting" to see full details and apply.`,
        applyUrl: company.careersUrl,
        location: 'Various',
        jobType: 'Full-time'
      });
      setQuickTitle('');
      loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setQuickBusy(false);
    }
  }

  async function removeJob(id) {
    try {
      await api.del(`/admin/jobs/${id}`);
      setJobs((prev) => prev.filter((j) => j._id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function runQuestionGen() {
    setGenBusy(true);
    setError('');
    try {
      const result = await api.post('/admin/ingest/questions', {});
      setGenResult(result);
      loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenBusy(false);
    }
  }

  async function addQuestion(e) {
    e.preventDefault();
    if (!qCompanyId || !qContent.trim()) return;
    setQBusy(true);
    setError('');
    try {
      await api.post('/admin/questions', {
        companyId: qCompanyId,
        type: qType,
        difficulty: qDifficulty,
        content: qContent.trim()
      });
      setQContent('');
      loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setQBusy(false);
    }
  }

  async function removeQuestion(id) {
    try {
      await api.del(`/admin/questions/${id}`);
      setQuestions((prev) => prev.filter((q) => q._id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="main">
      <p className="muted" style={{ marginBottom: 16 }}>Users, subscriptions, and the content pipeline.</p>
      {error && <p className="error-text">{error}</p>}

      {analytics && (
        <div className="grid grid-4" style={{ marginBottom: 24 }}>
          <div className="metric-card"><div className="metric-label">Total users</div><div className="metric-value">{analytics.totalUsers}</div></div>
          <div className="metric-card"><div className="metric-label">Active subscriptions</div><div className="metric-value">{analytics.activeSubs}</div></div>
          <div className="metric-card"><div className="metric-label">Active jobs</div><div className="metric-value">{analytics.totalJobs}</div></div>
        </div>
      )}

      <h3 style={{ marginBottom: 10 }}>Content pipeline</h3>
      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Fetch live jobs</div>
          <p className="muted" style={{ marginBottom: 12 }}>Pulls new postings from public job-board APIs and upserts them.</p>
          <button className="btn secondary" onClick={runJobIngest} disabled={ingestBusy}>
            <RefreshCw size={15} aria-hidden="true" className={ingestBusy ? 'spin' : ''} />
            {ingestBusy ? 'Fetching...' : 'Run now'}
          </button>
          {ingestResult && (
            <p className="muted" style={{ marginTop: 10 }}>
              Fetched {ingestResult.fetched}, added {ingestResult.created}, updated {ingestResult.updated}.
            </p>
          )}
        </div>
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Generate company questions</div>
          <p className="muted" style={{ marginBottom: 12 }}>Writes fresh, original practice questions per company.</p>
          <button className="btn secondary" onClick={runQuestionGen} disabled={genBusy}>
            <Sparkles size={15} aria-hidden="true" />
            {genBusy ? 'Generating...' : 'Run now'}
          </button>
          {genResult && (
            <div style={{ marginTop: 10 }}>
              <p className="muted">Added {genResult.totalAdded} new question{genResult.totalAdded === 1 ? '' : 's'}.</p>
              {genResult.details.filter((d) => d.added === 0).length > 0 && (
                <details style={{ marginTop: 6 }}>
                  <summary className="muted" style={{ cursor: 'pointer' }}>Why some didn't add questions</summary>
                  <ul style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, paddingLeft: 18 }}>
                    {genResult.details.filter((d) => d.added === 0).map((d, i) => (
                      <li key={i}>{d.company} — {d.type}: {d.reason}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
      
      <h3 style={{ marginBottom: 10 }}>Quick add — known companies</h3>
      <p className="muted" style={{ marginBottom: 12 }}>
        Free job-board APIs don't carry direct postings from large companies like these (confirmed — tested against three providers). This links straight to their real careers page instead of guessing at a fake listing.
      </p>
      <form className="card" onSubmit={quickAddJob} style={{ marginBottom: 24 }}>
        <div className="grid grid-2" style={{ marginBottom: 12 }}>
          <div>
            <label>Company</label>
            <select className="input" value={quickCompany} onChange={(e) => setQuickCompany(e.target.value)}>
              {knownCompanies.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Role title</label>
            <input className="input" value={quickTitle} onChange={(e) => setQuickTitle(e.target.value)} placeholder="e.g. Software Engineer II" />
          </div>
        </div>
        <button className="btn gold" type="submit" disabled={quickBusy || !quickTitle.trim()}>
          {quickBusy ? 'Adding...' : 'Add job'}
        </button>
      </form>
    
      <h3 style={{ marginBottom: 10 }}>Add a question manually</h3>
      <form className="card" onSubmit={addQuestion} style={{ marginBottom: 24 }}>
        <div className="grid grid-2" style={{ marginBottom: 12 }}>
          <div>
            <label>Company</label>
            <select className="input" value={qCompanyId} onChange={(e) => setQCompanyId(e.target.value)}>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-2">
            <div>
              <label>Type</label>
              <select className="input" value={qType} onChange={(e) => setQType(e.target.value)}>
                <option value="OA">OA</option>
                <option value="Technical">Technical</option>
                <option value="HR">HR</option>
              </select>
            </div>
            <div>
              <label>Difficulty</label>
              <select className="input" value={qDifficulty} onChange={(e) => setQDifficulty(e.target.value)}>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>
        </div>
        <label>Question</label>
        <textarea className="input" rows={3} value={qContent} onChange={(e) => setQContent(e.target.value)} placeholder="Type the question..." />
        <button className="btn gold" type="submit" disabled={qBusy || !qCompanyId}>
          {qBusy ? 'Adding...' : 'Add question'}
        </button>
      </form>
      <h3 style={{ marginBottom: 10 }}>Jobs ({jobs.length}) — auto-deleted after {7} days</h3>
      {jobs.map((j) => (
        <div className="card" key={j._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
          <div>
            <div style={{ fontWeight: 600 }}>{j.title}</div>
            <div className="muted">{j.companyName} · {j.source} · posted {new Date(j.createdAt).toLocaleDateString()}</div>
          </div>
          <button className="btn secondary" style={{ padding: '6px 10px' }} onClick={() => removeJob(j._id)}>
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      ))}
      <h3 style={{ marginBottom: 10 }}>All questions ({questions.length})</h3>
      {questions.map((q) => (
        <div className="card" key={q._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 18px' }}>
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
              <span className="pill muted">{q.companyId?.name}</span>
              <span className="pill muted">{q.type}</span>
              {q.source === 'ai_generated' && <span className="pill gold">AI-generated</span>}
            </div>
            <div style={{ fontSize: 14 }}>{q.content}</div>
          </div>
          <button className="btn secondary" style={{ padding: '6px 10px' }} onClick={() => removeQuestion(q._id)}>
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      ))}

      <h3 style={{ marginTop: 24, marginBottom: 10 }}>Users</h3>
      {users.map((u) => (
        <div className="card" key={u._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
          <div>{u.name} — <span className="muted">{u.email}</span></div>
          <span className="pill muted">{u.role}</span>
        </div>
      ))}

      <h3 style={{ marginTop: 24, marginBottom: 10 }}>Subscriptions</h3>
      {subs.map((s) => (
        <div className="card" key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
          <div>{s.userId?.name} — <span className="muted">{s.userId?.email}</span></div>
          <span className="pill gold">{s.plan} · {s.status}</span>
        </div>
      ))}
    </div>
  );
}