import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function JobBoard() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [appliedIds, setAppliedIds] = useState(new Set());

  useEffect(() => {
    api.get(`/jobs${search ? `?search=${encodeURIComponent(search)}` : ''}`)
      .then((data) => setJobs(data.jobs))
      .catch((err) => setError(err.message));
  }, [search]);

  async function apply(job) {
    try {
      await api.post('/dashboard/applications', { jobId: job._id, status: 'Applied' });
      setAppliedIds((prev) => new Set(prev).add(job._id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="main">
      <p className="muted" style={{ marginBottom: 16 }}>Roles from companies actively hiring right now.</p>
      {error && <p className="error-text">{error}</p>}
      <input
        className="input"
        placeholder="Search by title or company"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {jobs.map((job) => (
        <div className="card" key={job._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600 }}>{job.title}</div>
            <div className="muted">{job.companyName} · {job.location} · {job.jobType}</div>
            <p style={{ marginTop: 8, maxWidth: 500 }}>{job.description}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            <a href={job.applyUrl} target="_blank" rel="noreferrer" className="btn secondary">View posting</a>
            <button className="btn gold" disabled={appliedIds.has(job._id)} onClick={() => apply(job)}>
              {appliedIds.has(job._id) ? 'Tracked' : 'Track application'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
