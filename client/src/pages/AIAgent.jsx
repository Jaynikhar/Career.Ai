import { useEffect, useState } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { api } from '../api/client.js';

const ACTIONS = [
  { key: 'resume', label: 'Customize resume', endpoint: '/ai/resume/customize', placeholder: 'Paste your LaTeX resume source here...' },
  { key: 'cover', label: 'Generate cover letter', endpoint: '/ai/cover-letter', placeholder: 'Paste a short summary of your background...' },
  { key: 'email', label: 'Draft cold email', endpoint: '/ai/cold-email/draft', placeholder: 'Paste a short summary of your background...' },
  { key: 'referral', label: 'LinkedIn referral message', endpoint: '/ai/linkedin-referral/draft', placeholder: 'Paste a short summary of your background...' }
];

export default function AIAgent() {
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState('');
  const [action, setAction] = useState(ACTIONS[0]);
  const [context, setContext] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);

  const [manualMode, setManualMode] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualCompany, setManualCompany] = useState('');
  const [manualDescription, setManualDescription] = useState('');

  useEffect(() => {
    api.get('/jobs').then((data) => {
      setJobs(data.jobs);
      if (data.jobs[0]) setJobId(data.jobs[0]._id);
    });
  }, []);

  async function generate() {
    setError('');
    setOutput('');

    if (manualMode && (!manualTitle.trim() || !manualCompany.trim())) {
      setError('Enter at least a job title and company name.');
      return;
    }
    if (!manualMode && !jobId) {
      setError('Select a job, or switch to manual entry.');
      return;
    }

    setBusy(true);
    try {
      const body = manualMode
        ? { manualJob: { title: manualTitle, companyName: manualCompany, description: manualDescription }, context }
        : { jobId, context };

      const data = await api.post(action.endpoint, body);
      setOutput(data.output);
    } catch (err) {
      if (err.code === 'SUBSCRIPTION_REQUIRED') setLocked(true);
      else setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="main">
      <p className="muted" style={{ marginBottom: 16 }}>Tailor your resume, cover letter, or outreach to a specific role.</p>
      {locked && (
        <div className="banner danger">
          <Lock aria-hidden="true" />
          The AI agent is a subscriber-only feature. <a href="/subscription">Choose a plan to unlock it.</a>
        </div>
      )}
      {error && <p className="error-text">{error}</p>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className={`btn ${!manualMode ? 'gold' : 'secondary'}`} onClick={() => setManualMode(false)}>Pick from job board</button>
        <button className={`btn ${manualMode ? 'gold' : 'secondary'}`} onClick={() => setManualMode(true)}>Enter job manually</button>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 12 }}>
        {!manualMode ? (
          <div>
            <label>Target job</label>
            <select className="input" value={jobId} onChange={(e) => setJobId(e.target.value)}>
              {jobs.map((j) => (
                <option key={j._id} value={j._id}>{j.title} — {j.companyName}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="grid grid-2" style={{ gridColumn: '1 / -1' }}>
            <div>
              <label>Job title</label>
              <input className="input" value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} placeholder="e.g. Backend Engineer" />
            </div>
            <div>
              <label>Company name</label>
              <input className="input" value={manualCompany} onChange={(e) => setManualCompany(e.target.value)} placeholder="e.g. Acme Corp" />
            </div>
          </div>
        )}
        <div>
          <label>Action</label>
          <select className="input" value={action.key} onChange={(e) => setAction(ACTIONS.find((a) => a.key === e.target.value))}>
            {ACTIONS.map((a) => (
              <option key={a.key} value={a.key}>{a.label}</option>
            ))}
          </select>
        </div>
      </div>

      {manualMode && (
        <>
          <label>Job description (optional, but improves output)</label>
          <textarea
            className="input"
            rows={5}
            placeholder="Paste the job description here..."
            value={manualDescription}
            onChange={(e) => setManualDescription(e.target.value)}
          />
        </>
      )}

      <label>Context (resume text, LaTeX source, or background summary)</label>
      <textarea
        className="input"
        rows={8}
        placeholder={action.placeholder}
        value={context}
        onChange={(e) => setContext(e.target.value)}
      />

      <button className="btn gold" onClick={generate} disabled={busy}>
        <Sparkles size={15} aria-hidden="true" />
        {busy ? 'Generating...' : 'Generate'}
      </button>

      {output && (
        <div className="card" style={{ marginTop: 20, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          {output}
        </div>
      )}
    </div>
  );
}