import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, loading: authLoading, loginUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate(user.role === 'admin' ? '/admin' : '/engineer', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async () => {
    if (!form.email || !form.password) { setError('All fields required'); return; }
    setLoading(true); setError('');
    try {
      const res = await login(form);
      loginUser(res.data.token, res.data.user);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/engineer');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || user) {
    return <div className="flex-center" style={{ height: '100vh' }}><span className="spinner spinner-dark" /></div>;
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div style={{ fontSize: '2.5rem' }}>📶</div>
          <h2>Staff Portal</h2>
          <p>JH Health WiFi Complaint System</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className="form-control" type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-control" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>

        <button className="btn btn-primary btn-block btn-lg" onClick={handleSubmit} disabled={loading} style={{ marginTop: 8 }}>
          {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In'}
        </button>

        <div className="text-center mt-3">
          <Link to="/" style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>← Back to complaint form</Link>
        </div>

        <div className="mt-3" style={{ padding: '14px', background: 'var(--gray-50)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--gray-500)' }}>
          <strong>Demo Credentials</strong><br />
          Admin: admin@jhhealthwifi.gov.in / Admin@1234<br />
          Engineer: engineer1@jhhealthwifi.gov.in / Eng@1234
        </div>
      </div>
    </div>
  );
}
