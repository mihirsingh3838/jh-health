import { useState, useEffect, Fragment } from 'react';
import { getDistricts, getFacilityTypes, getFacilities, sendEmailOTP, verifyEmailOTP, submitComplaint, uploadComplaintImages } from '../api';
import Navbar from '../components/Navbar';
import PublicFooter from '../components/PublicFooter';
import { useNavigate } from 'react-router-dom';

const ISSUES = [
  { id: 'No Internet Connectivity', icon: '🔌', title: 'No Internet Connectivity', desc: 'Cannot access the internet at all' },
  { id: 'Slow Internet Speed', icon: '🐢', title: 'Slow Internet Speed', desc: 'Internet is extremely slow or unusable' },
  { id: 'Frequent Disconnections', icon: '🔄', title: 'Frequent Disconnections', desc: 'Connection drops repeatedly' },
  { id: 'WiFi Not Visible / SSID Not Broadcasting', icon: '📡', title: 'WiFi Not Visible', desc: 'SSID not showing in available networks' },
  { id: 'Unable to Connect to WiFi', icon: '🔒', title: 'Unable to Connect', desc: 'Password or authentication issues' },
  { id: 'Limited Connectivity (Connected but No Internet)', icon: '⚠️', title: 'Limited Connectivity', desc: 'Connected to WiFi but no internet access' },
  { id: 'Router / Access Point Not Working', icon: '📶', title: 'Device Not Working', desc: 'Router/Access point hardware issue' },
  { id: 'Power Issue at Equipment', icon: '⚡', title: 'Power Issue', desc: 'Equipment has no power / power failure' },
  { id: 'Other', icon: '💬', title: 'Other Issue', desc: 'Something else not listed above' },
];

const STEP_LABELS = ['Facility', 'Details', 'Issue', 'Confirm'];

function ReportWifiBadge({ variant }) {
  return (
    <div className={`report-cta-art report-cta-art--${variant}`} aria-hidden>
      <div className="report-cta-art-circle">
        <img
          src="/icons/wifi-report.png"
          alt=""
          className="report-cta-wifi-logo"
          decoding="async"
        />
      </div>
    </div>
  );
}

function StepIndicator({ current }) {
  return (
    <div className="step-progress-shell">
      <p className="step-progress-meta">
        Step <strong>{current + 1}</strong> of 4 · <strong>{STEP_LABELS[current]}</strong>
      </p>
      <div className="step-progress-track">
        {STEP_LABELS.map((label, i) => (
          <Fragment key={label}>
            {i > 0 && (
              <div
                className={`step-progress-connector ${current >= i ? 'done' : ''}`}
                role="presentation"
              />
            )}
            <div
              className={`step-progress-node ${i < current ? 'done' : ''} ${i === current ? 'active' : ''}`}
            >
              <span className="step-progress-dot" />
              <span className="step-progress-label">{label}</span>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ userName: '', mobile: '', email: '', district: '', facilityType: '', facilityCode: '', facilityName: '', issueCategory: '', issueDescription: '', attachmentUrls: [] });
  const [errors, setErrors] = useState({});
  const [districts, setDistricts] = useState([]);
  const [facilityTypes, setFacilityTypes] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [facilityError, setFacilityError] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setFacilityError('');
    getDistricts()
      .then(r => setDistricts(r.data || []))
      .catch(err => {
        console.error('Failed to load districts:', err);
        setFacilityError('Unable to load facilities. Please check your connection and try again.');
      });
  }, []);
  useEffect(() => {
    if (form.district) {
      setFacilityError('');
      getFacilityTypes(form.district)
        .then(r => setFacilityTypes(r.data || []))
        .catch(() => setFacilityTypes([]));
      setForm(f => ({ ...f, facilityType: '', facilityCode: '', facilityName: '' }));
      setFacilities([]);
    } else {
      setFacilityTypes([]);
    }
  }, [form.district]);
  useEffect(() => {
    if (form.district && form.facilityType) {
      getFacilities(form.district, form.facilityType)
        .then(r => setFacilities(r.data || []))
        .catch(() => setFacilities([]));
      setForm(f => ({ ...f, facilityCode: '', facilityName: '' }));
    } else {
      setFacilities([]);
    }
  }, [form.district, form.facilityType]);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (k === 'email') {
      setEmailVerified(false);
      setOtpSent(false);
      setOtpInput('');
      setOtpError('');
    }
  };

  const validate0 = () => {
    const e = {};
    if (!form.district) e.district = 'Select a district';
    if (!form.facilityType) e.facilityType = 'Select facility type';
    if (!form.facilityCode) e.facilityCode = 'Select a health facility';
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const validate1 = () => {
    const e = {};
    if (!form.userName.trim()) e.userName = 'Name is required';
    if (!/^[6-9]\d{9}$/.test(form.mobile)) e.mobile = 'Enter valid 10-digit mobile number';
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter valid email address';
    if (!emailVerified) e.emailVerify = 'Please verify your email with OTP';
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const validate2 = () => {
    if (!form.issueCategory) { setErrors({ issueCategory: 'Select an issue' }); return false; }
    setErrors({});
    return true;
  };

  const next = () => {
    const valid = [validate0, validate1, validate2][step]?.();
    if (valid !== false) setStep(s => s + 1);
  };
  const back = () => setStep(s => s - 1);

  const handleSendOTP = async () => {
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setErrors({ email: 'Enter valid email address first' });
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      await sendEmailOTP(form.email);
      setOtpSent(true);
      setOtpInput('');
      setErrors(e => ({ ...e, email: undefined }));
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to send OTP. Try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const current = form.attachmentUrls?.length || 0;
    const toAdd = Math.min(files.length, 2 - current);
    if (toAdd <= 0) {
      setImageError('Maximum 2 images allowed');
      return;
    }
    const selected = files.slice(0, toAdd).filter(f => f.type.startsWith('image/'));
    if (selected.length === 0) {
      setImageError('Please select image files (JPEG, PNG, GIF, WebP)');
      return;
    }
    setImageUploading(true);
    setImageError('');
    try {
      const res = await uploadComplaintImages(selected);
      const urls = res.data?.urls || [];
      setForm(f => ({ ...f, attachmentUrls: [...(f.attachmentUrls || []), ...urls].slice(0, 2) }));
    } catch (err) {
      setImageError(err.response?.data?.message || 'Failed to upload images. Try again.');
    } finally {
      setImageUploading(false);
    }
    e.target.value = '';
  };

  const removeImage = (idx) => {
    setForm(f => ({ ...f, attachmentUrls: (f.attachmentUrls || []).filter((_, i) => i !== idx) }));
    setImageError('');
  };

  const handleVerifyOTP = async () => {
    if (otpInput.length !== 6) {
      setOtpError('Enter the 6-digit OTP');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      await verifyEmailOTP(form.email, otpInput);
      setEmailVerified(true);
      setOtpError('');
      setErrors(e => ({ ...e, emailVerify: undefined }));
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid OTP. Try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await submitComplaint(form);
      // Prefill tracking contact without exposing ticket id in URL.
      localStorage.setItem('trackEmail', (form.email || '').toLowerCase().trim());
      localStorage.setItem('trackMobile', (form.mobile || '').trim());
      setSubmitted(res.data);
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Submission failed. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div className="card" style={{ maxWidth: 520, width: '100%' }}>
            <div className="card-body success-box">
              <div className="success-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A7A4A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2>Complaint Registered!</h2>
              <p className="text-muted mt-1">Your issue has been submitted. Please save your ticket ID to track the status.</p>
              <div className="ticket-id-display">
                <div className="ticket-id-label">Your Ticket ID</div>
                <div className="ticket-id-value">{submitted.ticketId}</div>
              </div>
              <div className="flex gap-2 mt-3" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-outline" onClick={() => navigate('/track')}>Track Status</button>
                <button className="btn btn-primary" onClick={() => { setSubmitted(null); setStep(0); setForm({ userName:'',mobile:'',email:'',district:'',facilityType:'',facilityCode:'',facilityName:'',issueCategory:'',issueDescription:'',attachmentUrls:[] }); setEmailVerified(false); setOtpSent(false); setOtpInput(''); setOtpError(''); setImageError(''); localStorage.removeItem('trackEmail'); localStorage.removeItem('trackMobile'); }}>New Complaint</button>
              </div>
            </div>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const scrollToForm = () => {
    document.getElementById('complaint-flow')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="home-public-bg">
        <section className="report-cta-card" aria-label="Report or track complaint">
          <div className="report-cta-inner">
            <div className="report-cta-copy">
              <div className="report-cta-heading-row">
                <h2 className="report-cta-title">Report WiFi Issue</h2>
                <ReportWifiBadge variant="inline" />
              </div>
              <p className="report-cta-desc">
                Facing internet issues at your health facility? Raise a complaint in seconds.
              </p>
              <div className="report-cta-buttons">
                <button
                  type="button"
                  className="btn-report-primary"
                  onClick={() => { setStep(0); scrollToForm(); }}
                >
                  Report New Issue
                </button>
                <button type="button" className="btn-report-secondary" onClick={() => navigate('/track')}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  Track Complaint
                </button>
              </div>
            </div>
            <ReportWifiBadge variant="side" />
          </div>
        </section>

        <StepIndicator current={step} />

        <div id="complaint-flow" className="complaint-form-shell">
          <div className="complaint-form-card">
            <div className="card-body">
            {/* Step 0: Facility Selection */}
            {step === 0 && (
              <div>
                <h3 className="complaint-step-heading">Select Health Facility</h3>
                {facilityError && <div className="alert alert-error mb-3">{facilityError}</div>}
                <div className="form-group">
                  <div className="form-label-row">
                    <span className="label-icon" aria-hidden>📍</span>
                    <span>District <span className="req">*</span></span>
                  </div>
                  <div className="field-select-wrap">
                    <span className="field-select-wrap__icon" aria-hidden>🔍</span>
                    <select className="form-control" value={form.district} onChange={e => set('district', e.target.value)} aria-label="Select district">
                      <option value="">Select District</option>
                      {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  {errors.district && <div className="form-error">{errors.district}</div>}
                </div>
                <div className="form-group">
                  <div className="form-label-row">
                    <span className="label-icon" aria-hidden>🏥</span>
                    <span>Facility Type <span className="req">*</span></span>
                  </div>
                  <div className="field-select-wrap">
                    <span className="field-select-wrap__icon" aria-hidden>🏢</span>
                    <select className="form-control" value={form.facilityType} onChange={e => set('facilityType', e.target.value)} disabled={!form.district} aria-label="Select facility type">
                      <option value="">Select Type</option>
                      {facilityTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  {errors.facilityType && <div className="form-error">{errors.facilityType}</div>}
                </div>
                <div className="form-group">
                  <div className="form-label-row">
                    <span className="label-icon" aria-hidden>🏥</span>
                    <span>Health Facility <span className="req">*</span></span>
                  </div>
                  <div className="field-select-wrap">
                    <span className="field-select-wrap__icon" aria-hidden>🔍</span>
                    <select className="form-control" value={form.facilityCode} onChange={e => {
                      const fac = facilities.find(f => f.facility_code === e.target.value);
                      set('facilityCode', e.target.value);
                      set('facilityName', fac?.facility_name || '');
                    }} disabled={!form.facilityType} aria-label="Select health facility">
                      <option value="">Select Facility</option>
                      {facilities.map(f => <option key={f.facility_code} value={f.facility_code}>{f.facility_name}</option>)}
                    </select>
                  </div>
                  {errors.facilityCode && <div className="form-error">{errors.facilityCode}</div>}
                </div>
              </div>
            )}

            {/* Step 1: User Details */}
            {step === 1 && (
              <div>
                <h3 className="complaint-step-heading">Your Contact Details</h3>
                <div className="form-group">
                  <label className="form-label">Full Name <span className="req">*</span></label>
                  <input className="form-control" placeholder="e.g. Rajesh Kumar" value={form.userName} onChange={e => set('userName', e.target.value)} />
                  {errors.userName && <div className="form-error">{errors.userName}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number <span className="req">*</span></label>
                  <input className="form-control" placeholder="10-digit mobile" maxLength={10} value={form.mobile} onChange={e => set('mobile', e.target.value.replace(/\D/,''))} />
                  {errors.mobile && <div className="form-error">{errors.mobile}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address <span className="req">*</span></label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <input
                      className="form-control"
                      type="email"
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      style={{ flex: '1 1 200px' }}
                      disabled={emailVerified}
                    />
                    {!emailVerified && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={handleSendOTP}
                        disabled={otpLoading || !/\S+@\S+\.\S+/.test(form.email)}
                      >
                        {otpLoading && !otpSent ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Sending...</> : otpSent ? 'Resend OTP' : 'Send OTP'}
                      </button>
                    )}
                    {emailVerified && <span style={{ color: 'var(--green-600)', fontWeight: 600, alignSelf: 'center' }}>✓ Verified</span>}
                  </div>
                  {errors.email && <div className="form-error">{errors.email}</div>}
                  {errors.emailVerify && <div className="form-error">{errors.emailVerify}</div>}
                  {otpSent && !emailVerified && (
                    <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        className="form-control"
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        value={otpInput}
                        onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                        style={{ width: 140 }}
                      />
                      <button type="button" className="btn btn-primary" onClick={handleVerifyOTP} disabled={otpLoading || otpInput.length !== 6}>
                        {otpLoading && otpInput.length === 6 ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Verifying...</> : 'Verify'}
                      </button>
                    </div>
                  )}
                  {otpError && <div className="form-error" style={{ marginTop: 8 }}>{otpError}</div>}
                </div>
              </div>
            )}

            {/* Step 2: Issue Selection */}
            {step === 2 && (
              <div>
                <h3 className="complaint-step-heading">What&apos;s the Issue?</h3>
                {errors.issueCategory && <div className="alert alert-error">{errors.issueCategory}</div>}
                <div className="issue-grid">
                  {ISSUES.map(issue => (
                    <div key={issue.id} className={`issue-card ${form.issueCategory === issue.id ? 'selected' : ''}`} onClick={() => set('issueCategory', issue.id)}>
                      <div className="issue-card-icon">{issue.icon}</div>
                      <div>
                        <div className="issue-card-title">{issue.title}</div>
                        <div className="issue-card-desc">{issue.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="form-group mt-3">
                  <label className="form-label">Additional Details (Optional)</label>
                  <textarea className="form-control" rows={3} placeholder="Describe the issue in more detail..." value={form.issueDescription} onChange={e => set('issueDescription', e.target.value)} style={{ resize: 'vertical' }} />
                </div>
                <div className="form-group mt-3">
                  <label className="form-label">Attach Images (Optional, max 2)</label>
                  <p className="text-sm text-muted mb-2">Screenshots or photos of the issue – JPEG, PNG, GIF, WebP up to 5MB each</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
                    {(form.attachmentUrls || []).map((url, i) => (
                      <div key={i} style={{ position: 'relative', flex: '0 0 auto' }}>
                        <img src={url} alt={`Attachment ${i + 1}`} style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--gray-200)' }} />
                        <button type="button" onClick={() => removeImage(i)} className="btn btn-ghost btn-sm" style={{ position: 'absolute', top: -4, right: -4, padding: 4, minWidth: 0, background: 'var(--gray-100)', borderRadius: '50%' }} aria-label="Remove">×</button>
                      </div>
                    ))}
                    {(form.attachmentUrls || []).length < 2 && (
                      <label className="btn btn-outline" style={{ margin: 0, cursor: imageUploading ? 'not-allowed' : 'pointer' }}>
                        {imageUploading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Uploading...</> : '📷 Add Image'}
                        <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple style={{ display: 'none' }} onChange={handleImageSelect} disabled={imageUploading} />
                      </label>
                    )}
                  </div>
                  {imageError && <div className="form-error mt-2">{imageError}</div>}
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <div>
                <h3 className="complaint-step-heading">Confirm Your Complaint</h3>
                {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
                <div className="card" style={{ background: 'var(--gray-50)', marginBottom: 20 }}>
                  <div className="card-body" style={{ padding: 20 }}>
                    <div className="grid-2" style={{ gap: 12 }}>
                      {[
                        ['Name', form.userName],
                        ['Mobile', form.mobile],
                        ['Email', form.email],
                        ['District', form.district],
                        ['Facility Type', form.facilityType],
                        ['Facility', form.facilityName],
                        ['Issue', form.issueCategory],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <div className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
                          <div className="text-sm font-semibold" style={{ color: 'var(--gray-700)', marginTop: 2 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {form.issueDescription && (
                      <div className="mt-2">
                        <div className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Details</div>
                        <div className="text-sm" style={{ color: 'var(--gray-700)', marginTop: 2 }}>{form.issueDescription}</div>
                      </div>
                    )}
                    {(form.attachmentUrls || []).length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attachments</div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                          {(form.attachmentUrls || []).map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                              <img src={url} alt={`Attachment ${i + 1}`} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--gray-200)' }} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted">By submitting, you confirm the above details are correct. You will receive a ticket ID for tracking.</p>
              </div>
            )}

            {/* Navigation */}
            <div className="complaint-footer-actions">
              {step > 0 ? (
                <button type="button" className="btn btn-ghost complaint-back-btn" onClick={back}>
                  ← Back
                </button>
              ) : (
                <span className="complaint-back-btn" />
              )}
              {step < 3 ? (
                <button type="button" className="btn btn-primary complaint-primary-action" onClick={next}>
                  Continue
                </button>
              ) : (
                <button type="button" className="btn btn-primary complaint-primary-action" onClick={handleSubmit} disabled={loading}>
                  {loading ? <><span className="spinner" /> Submitting...</> : '✓ Submit Complaint'}
                </button>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
