import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { trackComplaint } from '../api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';

export default function TrackTicket() {
  const [params] = useSearchParams();
  const [ticketId, setTicketId] = useState(params.get('id') || '');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async () => {
    if (!ticketId.trim()) return;
    setLoading(true); setError(''); setComplaint(null);
    try {
      const res = await trackComplaint(ticketId.trim().toUpperCase());
      setComplaint(res.data);
    } catch {
      setError('Ticket not found. Please check your ticket ID.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (params.get('id')) search(); }, []);

  const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  return (
    <div className="page-wrapper">
      <Navbar />
      <div style={{ flex: 1, background: 'var(--gray-50)' }}>
        <div className="track-wrapper">
          <div className="text-center mb-4">
            <h2>Track Your Complaint</h2>
            <p className="text-muted mt-1">Enter your ticket ID to see the current status</p>
          </div>

          <div className="card mb-3">
            <div className="card-body">
              <div className="flex gap-2 track-search-row">
                <input
                  className="form-control"
                  placeholder="e.g. JH-2412-00001"
                  value={ticketId}
                  onChange={e => setTicketId(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && search()}
                  style={{ fontFamily: 'var(--mono)', letterSpacing: '0.05em' }}
                />
                <button className="btn btn-primary" onClick={search} disabled={loading} style={{ flexShrink: 0 }}>
                  {loading ? <span className="spinner" /> : '🔍 Search'}
                </button>
              </div>
              {error && <div className="alert alert-error mt-2">{error}</div>}
            </div>
          </div>

          {complaint && (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Ticket ID</div>
                  <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary)' }}>{complaint.ticketId}</div>
                </div>
                <StatusBadge status={complaint.status} />
              </div>
              <div className="card-body">
                <div className="grid-2 mb-3">
                  {[
                    ['Complainant', complaint.userName],
                    ['Mobile', complaint.mobile],
                    ['District', complaint.district],
                    ['Facility', complaint.facilityName],
                    ['Facility Type', complaint.facilityType],
                    ['Issue', complaint.issueCategory],
                    ['Submitted On', fmt(complaint.createdAt)],
                    ['Assigned To', complaint.assignedTo?.name || 'Not yet assigned'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ borderBottom: '1px solid var(--gray-100)', paddingBottom: 12 }}>
                      <div className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--gray-700)', marginTop: 3 }}>{v}</div>
                    </div>
                  ))}
                </div>
                {complaint.resolutionNotes && (
                  <div className="alert alert-success">
                    <div><strong>Resolution Notes:</strong><br />{complaint.resolutionNotes}</div>
                  </div>
                )}
                {complaint.activityLog?.length > 0 && (
                  <div>
                    <h4 className="mb-2">Activity Timeline</h4>
                    <ul className="activity-log">
                      {[...complaint.activityLog].reverse().map((log, i) => (
                        <li key={i} className="activity-item">
                          <div className="activity-action">{log.action}</div>
                          <div className="activity-meta">{log.performedBy} · {fmt(log.timestamp)}</div>
                          {log.notes && <div className="text-sm text-muted mt-1">{log.notes}</div>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
