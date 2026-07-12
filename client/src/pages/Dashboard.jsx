import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const STAGES = [
  { key: 'Applied', label: 'Applied' },
  { key: 'ResponseReceived', label: 'Response received' },
  { key: 'Interviewing', label: 'Interviewing' },
  { key: 'OfferReceived', label: 'Offer received' }
];

const STATUS_LABEL = {
  Applied: 'Applied',
  ResponseReceived: 'Response received',
  Interviewing: 'Interviewing',
  OfferReceived: 'Offer received',
  Rejected: 'Rejected'
};

const STATUS_PILL_CLASS = {
  Applied: 'muted',
  ResponseReceived: 'gold',
  Interviewing: 'gold',
  OfferReceived: 'success',
  Rejected: 'danger'
};

export default function Dashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/applications')
      .then((data) => setApplications(data.applications))
      .catch((err) => setError(err.message));
  }, []);

  const counts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="main">
      <h1>Welcome back, {user?.name?.split(' ')[0]}</h1>
      <p className="muted" style={{ marginBottom: 24 }}>Here's where your search stands today.</p>
      {error && <p className="error-text">{error}</p>}

      <div className="grid grid-2">
        <div>
          <h3 style={{ marginBottom: 12 }}>Pipeline</h3>
          <div className="card">
            <div className="rail">
              {STAGES.map((s) => {
                const count = counts[s.key] || 0;
                const filled = count > 0;
                return (
                  <div className={`rail-item${filled ? ' filled' : ''}`} key={s.key}>
                    <div className="rail-dot">{filled && <Check aria-hidden="true" />}</div>
                    <div className="rail-label">{s.label}</div>
                    <div className="rail-count">{count} application{count === 1 ? '' : 's'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <h3 style={{ marginBottom: 12 }}>At a glance</h3>
          <div className="grid grid-2">
            <div className="metric-card">
              <div className="metric-label">Total applied</div>
              <div className="metric-value">{applications.length}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Offers</div>
              <div className="metric-value">{counts.OfferReceived || 0}</div>
            </div>
          </div>
        </div>
      </div>

      <h3 style={{ marginTop: 28, marginBottom: 12 }}>Your applications</h3>
      {applications.length === 0 && <p className="muted">No applications yet. Apply to a job from the job board to see it here.</p>}
      {applications.map((a) => (
        <div className="card" key={a._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <div style={{ fontWeight: 600 }}>{a.jobId?.title || 'Job removed'}</div>
            <div className="muted">{a.jobId?.companyName}</div>
          </div>
          <span className={`pill ${STATUS_PILL_CLASS[a.status]}`}>{STATUS_LABEL[a.status]}</span>
        </div>
      ))}
    </div>
  );
}
