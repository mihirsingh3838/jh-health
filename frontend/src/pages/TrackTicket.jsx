import { useEffect, useState } from 'react';
import { trackComplaintsByContact } from '../api';
import Navbar from '../components/Navbar';
import PublicFooter from '../components/PublicFooter';
import StatusBadge from '../components/StatusBadge';

export default function TrackTicket() {
  const [mode, setMode] = useState('email'); // 'email' | 'mobile'
  const [email, setEmail] = useState(localStorage.getItem('trackEmail') || '');
  const [mobile, setMobile] = useState(localStorage.getItem('trackMobile') || '');
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If we already have stored contact, auto-search for a smoother UX.
    const hasEmail = !!(localStorage.getItem('trackEmail') || '').trim();
    const hasMobile = !!(localStorage.getItem('trackMobile') || '').trim();
    if (hasEmail) setMode('email');
    else if (hasMobile) setMode('mobile');
  }, []);

  const search = async () => {
    setLoading(true);
    setError('');
    setComplaints([]);
    try {
      const query = {};
      if (mode === 'email') {
        const normalized = (email || '').toLowerCase().trim();
        if (!/\S+@\S+\.\S+/.test(normalized)) {
          setError('Enter a valid email address.');
          return;
        }
        query.email = normalized;
      } else {
        const normalizedMobile = (mobile || '').trim();
        if (!/^[6-9]\d{9}$/.test(normalizedMobile)) {
          setError('Enter a valid 10-digit mobile number.');
          return;
        }
        query.mobile = normalizedMobile;
      }

      const res = await trackComplaintsByContact(query);
      setComplaints(res.data?.complaints || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not fetch tracking details.');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  return (
    <div className="page-wrapper">
      <Navbar />
      <div style={{ flex: 1, background: 'var(--gray-50)' }}>
        <div className="track-wrapper">
          <div className="text-center mb-4">
            <h2>Track Your Complaint</h2>
            <p className="text-muted mt-1">Enter your email or mobile to see your complaints status</p>
          </div>

          <div className="card mb-3">
            <div className="card-body">
              <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`btn ${mode === 'email' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setMode('email')}
                >
                  Track by Email
                </button>
                <button
                  type="button"
                  className={`btn ${mode === 'mobile' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setMode('mobile')}
                >
                  Track by Mobile
                </button>
              </div>

              {mode === 'email' ? (
                <div className="flex gap-2 track-search-row" style={{ alignItems: 'center' }}>
                  <input
                    className="form-control"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && search()}
                    style={{ fontFamily: 'var(--mono)', letterSpacing: '0.02em' }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      localStorage.setItem('trackEmail', email);
                      localStorage.removeItem('trackMobile');
                      search();
                    }}
                    disabled={loading}
                    style={{ flexShrink: 0 }}
                  >
                    {loading ? <span className="spinner" /> : '🔍 Search'}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 track-search-row" style={{ alignItems: 'center' }}>
                  <input
                    className="form-control"
                    placeholder="10-digit mobile"
                    value={mobile}
                    onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onKeyDown={e => e.key === 'Enter' && search()}
                    style={{ fontFamily: 'var(--mono)', letterSpacing: '0.05em' }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      localStorage.setItem('trackMobile', mobile);
                      localStorage.removeItem('trackEmail');
                      search();
                    }}
                    disabled={loading}
                    style={{ flexShrink: 0 }}
                  >
                    {loading ? <span className="spinner" /> : '🔍 Search'}
                  </button>
                </div>
              )}
              {error && <div className="alert alert-error mt-2">{error}</div>}
            </div>
          </div>

          {complaints.length === 0 && !loading ? (
            <div className="text-center text-muted" style={{ padding: '18px 0' }}>
              No complaints found for the provided contact.
            </div>
          ) : (
            complaints.map((complaint) => (
              <div key={complaint._id || complaint.ticketId} className="card mb-3">
                <div className="card-header">
                  <div>
                    <div
                      className="text-xs text-muted font-semibold"
                      style={{ textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}
                    >
                      Ticket ID
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary)' }}>
                      {complaint.ticketId}
                    </div>
                    <div className="text-sm text-muted" style={{ marginTop: 4 }}>{fmt(complaint.createdAt)}</div>
                  </div>
                  <StatusBadge status={complaint.status} />
                </div>
                <div className="card-body">
                  <div className="grid-2 mb-3">
                    {[
                      ['District', complaint.district],
                      ['Facility', complaint.facilityName],
                      ['Facility Type', complaint.facilityType],
                      ['Issue', complaint.issueCategory],
                    ].map(([k, v]) => (
                      <div key={k} style={{ borderBottom: '1px solid var(--gray-100)', paddingBottom: 12 }}>
                        <div className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
                        <div className="text-sm font-semibold" style={{ color: 'var(--gray-700)', marginTop: 3 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {complaint.issueDescription && (
                    <div className="mb-3">
                      <div className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                        Additional Details
                      </div>
                      <div className="text-sm" style={{ color: 'var(--gray-700)' }}>{complaint.issueDescription}</div>
                    </div>
                  )}
                  {(complaint.attachmentUrls || []).length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                        Attachments
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {(complaint.attachmentUrls || []).map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt={`Attachment ${i + 1}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--gray-200)' }} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {complaint.resolutionNotes && (
                    <div className="alert alert-success">
                      <div><strong>Resolution Notes:</strong><br />{complaint.resolutionNotes}</div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
