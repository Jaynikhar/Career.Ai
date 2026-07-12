import { useEffect, useState } from 'react';
import { ExternalLink, Check } from 'lucide-react';
import { api } from '../api/client.js';

export default function JobBoard() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [expandedIds, setExpandedIds] = useState(new Set());

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

  function toggleExpanded(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
      {jobs.map((job) => {
        const expanded = expandedIds.has(job._id);
        return (
          <div className="card" key={job._id}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{job.title}</div>
            <div className="muted" style={{ marginTop: 2 }}>{job.companyName} · {job.location} · {job.jobType}</div>

            {job.description && (
              <>
                <p className={`job-desc${expanded ? '' : ' job-desc-clamped'}`}>{job.description}</p>
                <button className="job-desc-toggle" onClick={() => toggleExpanded(job._id)}>
                  {expanded ? 'Show less' : 'Show more'}
                </button>
              </>
            )}

            <div className="job-card-actions">
              <a href={job.applyUrl} target="_blank" rel="noreferrer" className="btn secondary">
                <ExternalLink size={14} aria-hidden="true" />
                View posting
              </a>
              <button className="btn gold" disabled={appliedIds.has(job._id)} onClick={() => apply(job)}>
                {appliedIds.has(job._id) && <Check size={14} aria-hidden="true" />}
                {appliedIds.has(job._id) ? 'Tracked' : 'Track application'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}