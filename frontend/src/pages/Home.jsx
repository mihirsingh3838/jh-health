import { useState, useEffect } from 'react';
import { getDistricts, getFacilityTypes, getFacilities, submitComplaint } from '../api';
import Navbar from '../components/Navbar';
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

const STEPS = ['Your Details', 'Facility', 'Issue', 'Confirm'];

function StepIndicator({ current }) {
  return (
    <div className="steps-indicator">
      {STEPS.map((label, i) => (
        <div key={i} className="step-item">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className={`step-circle ${i < current ? 'done' : i === current ? 'active' : 'pending'}`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className="step-label">{label}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`step-line ${i < current ? 'done' : ''}`} />}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ userName: '', mobile: '', email: '', district: '', facilityType: '', facilityCode: '', facilityName: '', issueCategory: '', issueDescription: '' });
  const [errors, setErrors] = useState({});
  const [districts, setDistricts] = useState([]);
  const [facilityTypes, setFacilityTypes] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [facilityError, setFacilityError] = useState('');
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

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate0 = () => {
    const e = {};
    if (!form.userName.trim()) e.userName = 'Name is required';
    if (!/^[6-9]\d{9}$/.test(form.mobile)) e.mobile = 'Enter valid 10-digit mobile number';
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter valid email address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const validate1 = () => {
    const e = {};
    if (!form.district) e.district = 'Select a district';
    if (!form.facilityType) e.facilityType = 'Select facility type';
    if (!form.facilityCode) e.facilityCode = 'Select a health facility';
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

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await submitComplaint(form);
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
                <button className="btn btn-outline" onClick={() => navigate(`/track?id=${submitted.ticketId}`)}>Track Status</button>
                <button className="btn btn-primary" onClick={() => { setSubmitted(null); setStep(0); setForm({ userName:'',mobile:'',email:'',district:'',facilityType:'',facilityCode:'',facilityName:'',issueCategory:'',issueDescription:'' }); }}>New Complaint</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="hero">
        <div className="hero-content">
          <div className="hero-badge">Jharkhand Health WiFi</div>
          <h1>Report a WiFi Issue</h1>
          <p>Experiencing connectivity issues at your health facility? Register a complaint and our team will resolve it promptly.</p>
        </div>
      </div>

      <div className="form-content" style={{ flex: 1 }}>
        {/* Quick Track Link */}
        <div className="flex justify-between items-center mb-3">
          <div />
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/track')}>🔍 Track existing complaint</button>
        </div>

        <div className="card">
          <div className="card-body">
            <StepIndicator current={step} />

            {/* Step 0: User Details */}
            {step === 0 && (
              <div>
                <h3 className="mb-3">Your Contact Details</h3>
                <div className="form-group">
                  <label className="form-label">Full Name <span className="req">*</span></label>
                  <input className="form-control" placeholder="e.g. Rajesh Kumar" value={form.userName} onChange={e => set('userName', e.target.value)} />
                  {errors.userName && <div className="form-error">{errors.userName}</div>}
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Mobile Number <span className="req">*</span></label>
                    <input className="form-control" placeholder="10-digit mobile" maxLength={10} value={form.mobile} onChange={e => set('mobile', e.target.value.replace(/\D/,''))} />
                    {errors.mobile && <div className="form-error">{errors.mobile}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address <span className="req">*</span></label>
                    <input className="form-control" type="email" placeholder="your@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
                    {errors.email && <div className="form-error">{errors.email}</div>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Facility Selection */}
            {step === 1 && (
              <div>
                <h3 className="mb-3">Select Health Facility</h3>
                {facilityError && <div className="alert alert-error mb-3">{facilityError}</div>}
                <div className="form-group">
                  <label className="form-label">District <span className="req">*</span></label>
                  <select className="form-control" value={form.district} onChange={e => set('district', e.target.value)}>
                    <option value="">-- Select District --</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.district && <div className="form-error">{errors.district}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Facility Type <span className="req">*</span></label>
                  <select className="form-control" value={form.facilityType} onChange={e => set('facilityType', e.target.value)} disabled={!form.district}>
                    <option value="">-- Select Facility Type --</option>
                    {facilityTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.facilityType && <div className="form-error">{errors.facilityType}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Health Facility <span className="req">*</span></label>
                  <select className="form-control" value={form.facilityCode} onChange={e => {
                    const fac = facilities.find(f => f.facility_code === e.target.value);
                    set('facilityCode', e.target.value);
                    set('facilityName', fac?.facility_name || '');
                  }} disabled={!form.facilityType}>
                    <option value="">-- Select Facility --</option>
                    {facilities.map(f => <option key={f.facility_code} value={f.facility_code}>{f.facility_name}</option>)}
                  </select>
                  {errors.facilityCode && <div className="form-error">{errors.facilityCode}</div>}
                </div>
              </div>
            )}

            {/* Step 2: Issue Selection */}
            {step === 2 && (
              <div>
                <h3 className="mb-3">What's the Issue?</h3>
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
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <div>
                <h3 className="mb-3">Confirm Your Complaint</h3>
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
                  </div>
                </div>
                <p className="text-sm text-muted">By submitting, you confirm the above details are correct. You will receive a ticket ID for tracking.</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-4">
              {step > 0 ? <button className="btn btn-ghost" onClick={back}>← Back</button> : <div />}
              {step < 3
                ? <button className="btn btn-primary" onClick={next}>Continue →</button>
                : <button className="btn btn-accent btn-lg" onClick={handleSubmit} disabled={loading}>
                    {loading ? <><span className="spinner" /> Submitting...</> : '✓ Submit Complaint'}
                  </button>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
