import { useState, useEffect, useCallback } from 'react';
import {
  getComplaints,
  getComplaintStats,
  getEngineers,
  assignComplaint,
  updateComplaintStatus,
  getUsers,
  registerUser,
  getDistricts,
  getFacilityTypes,
  getFacilities,
  getNotificationDirectory,
  saveGlobalNotificationContacts,
  saveFacilityNotificationMapping
} from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'complaints', label: 'All Complaints', icon: '📋' },
  { id: 'engineers', label: 'Manage Engineers', icon: '👷' },
  { id: 'mapping', label: 'Facility Mapping', icon: '📡' },
  { id: 'seed', label: 'Seed Facilities', icon: '🏥' },
];

function StatCard({ icon, value, label, color }) {
  return (
    <div className="card stat-card">
      <div className="stat-icon" style={{ background: color + '20' }}><span style={{ fontSize: '1.2rem' }}>{icon}</span></div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [engineers, setEngineers] = useState([]);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState({ status: '', district: '' });
  const [page, setPage] = useState(1);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modal, setModal] = useState(null); // 'assign' | 'status' | 'newUser'
  const [modalData, setModalData] = useState({});
  const [statusAwaitingOtp, setStatusAwaitingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'engineer', assignedDistricts: '' });
  const [seedJson, setSeedJson] = useState('');
  const [msg, setMsg] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [directory, setDirectory] = useState(null);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [facilityTypeOptions, setFacilityTypeOptions] = useState([]);
  const [facilityOptions, setFacilityOptions] = useState([]);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [mappingForm, setMappingForm] = useState({
    district: '',
    facilityType: '',
    facilityCode: '',
    facilityName: '',
    engineerName: '',
    engineerEmail: '',
    engineerMobile: '',
    teamLeadName: '',
    teamLeadEmail: '',
    teamLeadMobile: ''
  });
  const [globalContacts, setGlobalContacts] = useState({
    stateHeadName: '',
    stateHeadEmail: '',
    stateHeadMobile: '',
    opsManagerName: '',
    opsManagerEmail: '',
    opsManagerMobile: ''
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/login'); return; }
    loadStats();
    getEngineers().then(r => setEngineers(r.data));
  }, [user]);

  useEffect(() => { if (activeTab === 'complaints') loadComplaints(); }, [activeTab, filter, page]);
  useEffect(() => { if (activeTab === 'engineers') getUsers().then(r => setUsers(r.data)); }, [activeTab]);
  useEffect(() => {
    if (activeTab === 'mapping') {
      getDistricts().then(r => setDistrictOptions(r.data || [])).catch(() => setDistrictOptions([]));
      getNotificationDirectory().then(r => {
        const doc = r.data;
        setDirectory(doc);
        setGlobalContacts({
          stateHeadName: doc?.stateHead?.name || '',
          stateHeadEmail: doc?.stateHead?.email || '',
          stateHeadMobile: doc?.stateHead?.mobile || '',
          opsManagerName: doc?.opsManager?.name || '',
          opsManagerEmail: doc?.opsManager?.email || '',
          opsManagerMobile: doc?.opsManager?.mobile || ''
        });
      });
    }
  }, [activeTab]);
  useEffect(() => {
    if (!mappingForm.district) return setFacilityTypeOptions([]);
    getFacilityTypes(mappingForm.district).then(r => setFacilityTypeOptions(r.data || [])).catch(() => setFacilityTypeOptions([]));
  }, [mappingForm.district]);
  useEffect(() => {
    if (!mappingForm.district || !mappingForm.facilityType) return setFacilityOptions([]);
    getFacilities(mappingForm.district, mappingForm.facilityType).then(r => setFacilityOptions(r.data || [])).catch(() => setFacilityOptions([]));
  }, [mappingForm.district, mappingForm.facilityType]);

  const loadStats = () => getComplaintStats().then(r => setStats(r.data));
  const loadComplaints = useCallback(() => {
    getComplaints({ ...filter, page, limit: 15 }).then(r => { setComplaints(r.data.complaints); setTotal(r.data.total); });
  }, [filter, page]);

  const statMap = (key) => stats?.statusStats?.find(s => s._id === key)?.count || 0;
  const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  const handleAssign = async () => {
    setLoading(true);
    try { await assignComplaint(selectedComplaint._id, modalData.engineerId); setModal(null); loadComplaints(); loadStats(); }
    catch(e) { alert(e.response?.data?.error || e.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleStatus = async () => {
    setLoading(true);
    try {
      const payload = { status: modalData.status, notes: modalData.notes, priority: modalData.priority };
      if (modalData.status === 'resolved' && modalData.otp) payload.otp = modalData.otp;

      const res = await updateComplaintStatus(selectedComplaint._id, payload);

      if (res.data?.requiresOtp) {
        setStatusAwaitingOtp(true);
        setMsg(res.data.message || 'OTP sent to complainant. Enter the code they provide.');
      } else {
        setModal(null);
        setStatusAwaitingOtp(false);
        loadComplaints();
        loadStats();
      }
    } catch(e) { alert(e.response?.data?.error || e.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleNewUser = async () => {
    setLoading(true);
    try {
      await registerUser({ ...newUser, assignedDistricts: newUser.assignedDistricts.split(',').map(s => s.trim()).filter(Boolean) });
      setModal(null); setMsg('User created successfully!');
      getUsers().then(r => setUsers(r.data));
      setNewUser({ name: '', email: '', password: '', role: 'engineer', assignedDistricts: '' });
    } catch(e) { alert(e.response?.data?.error || e.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleSeed = async () => {
    try {
      const data = JSON.parse(seedJson);
      const arr = Array.isArray(data) ? data : [data];
      const { seedFacilities } = await import('../api');
      const res = await seedFacilities(arr);
      setMsg(`✅ ${res.data?.message || `${arr.length} facilities seeded successfully!`}`);
    } catch(e) {
      const err = e.response?.data?.error || e.response?.data?.message || e.message;
      setMsg('❌ Invalid JSON or seed failed: ' + err);
    }
  };
  const handleSaveGlobalContacts = async () => {
    setMappingLoading(true);
    try {
      const res = await saveGlobalNotificationContacts({
        stateHead: {
          name: globalContacts.stateHeadName,
          email: globalContacts.stateHeadEmail,
          mobile: globalContacts.stateHeadMobile
        },
        opsManager: {
          name: globalContacts.opsManagerName,
          email: globalContacts.opsManagerEmail,
          mobile: globalContacts.opsManagerMobile
        }
      });
      setDirectory(res.data.directory);
      setMsg('✅ Global contacts saved successfully.');
    } catch (e) {
      setMsg('❌ Failed to save global contacts: ' + (e.response?.data?.message || e.message));
    } finally {
      setMappingLoading(false);
    }
  };
  const handleSaveFacilityMapping = async () => {
    if (!mappingForm.facilityCode) return setMsg('❌ Please select a health facility.');
    setMappingLoading(true);
    try {
      const res = await saveFacilityNotificationMapping(mappingForm.facilityCode, {
        district: mappingForm.district,
        facilityType: mappingForm.facilityType,
        facilityName: mappingForm.facilityName,
        engineer: {
          name: mappingForm.engineerName,
          email: mappingForm.engineerEmail,
          mobile: mappingForm.engineerMobile
        },
        teamLead: {
          name: mappingForm.teamLeadName,
          email: mappingForm.teamLeadEmail,
          mobile: mappingForm.teamLeadMobile
        }
      });
      setDirectory(res.data.directory);
      setMsg('✅ Facility mapping saved successfully.');
    } catch (e) {
      setMsg('❌ Failed to save facility mapping: ' + (e.response?.data?.message || e.message));
    } finally {
      setMappingLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-inner navbar-inner-split">
          <div className="navbar-logo-slot navbar-logo-slot--left navbar-admin-left">
            <button type="button" className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">☰</button>
            <img src="/logos/abdm.png" alt="ABDM" className="navbar-logo-img" />
          </div>
          <div className="navbar-brand-center">
            <span className="navbar-title">डिजिटल स्वास्थ्य सेतु</span>
            <span className="navbar-subtitle">स्वास्थ्य और संचार, हर कदम आपके साथ</span>
          </div>
          <div className="navbar-logo-slot navbar-logo-slot--right">
            <img src="/logos/bsnl.png" alt="BSNL" className="navbar-logo-img" />
            <div className="navbar-actions navbar-actions--compact">
              <span className="navbar-user navbar-user--compact">{user?.name}</span>
              <span className="navbar-role navbar-role--compact">Admin</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { logoutUser(); navigate('/login'); }} style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>Logout</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile sidebar overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} aria-hidden={!sidebarOpen} />

      {/* Mobile sidebar drawer */}
      <aside className={`sidebar-mobile ${sidebarOpen ? 'open' : ''}`}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="font-semibold">Menu</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setSidebarOpen(false)} style={{ padding: '4px 8px' }}>✕</button>
        </div>
        <div className="sidebar-section" style={{ paddingTop: 16 }}>
          <div className="sidebar-label">Navigation</div>
          {NAV.map(n => (
            <div key={n.id} className={`sidebar-link ${activeTab === n.id ? 'active' : ''}`} onClick={() => { setActiveTab(n.id); setSidebarOpen(false); }}>
              <span>{n.icon}</span>{n.label}
            </div>
          ))}
        </div>
        <div className="sidebar-section" style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--gray-100)' }}>
          <div className="sidebar-link" onClick={() => { logoutUser(); navigate('/'); setSidebarOpen(false); }}>
            <span>🏠</span>Public Portal
          </div>
        </div>
      </aside>

      <div className="dashboard-layout">
        {/* Desktop Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-label">Navigation</div>
            {NAV.map(n => (
              <div key={n.id} className={`sidebar-link ${activeTab === n.id ? 'active' : ''}`} onClick={() => setActiveTab(n.id)}>
                <span>{n.icon}</span>{n.label}
              </div>
            ))}
          </div>
          <div className="sidebar-section" style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--gray-100)' }}>
            <div className="sidebar-link" onClick={() => { logoutUser(); navigate('/'); }}>
              <span>🏠</span>Public Portal
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="main-content">
          {msg && <div className="alert alert-success mb-3" onClick={() => setMsg('')}>{msg} <span style={{ cursor: 'pointer', marginLeft: 'auto' }}>✕</span></div>}

          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="mb-3">Dashboard Overview</h2>
              <div className="grid-4 mb-4">
                <StatCard icon="📋" value={stats?.total || 0} label="Total Complaints" color="#0F4C81" />
                <StatCard icon="🔵" value={statMap('open')} label="Open" color="#1D4ED8" />
                <StatCard icon="🟡" value={statMap('in_progress')} label="In Progress" color="#B45309" />
                <StatCard icon="✅" value={statMap('resolved') + statMap('closed')} label="Resolved/Closed" color="#1A7A4A" />
              </div>

              {stats?.districtStats?.length > 0 && (
                <div className="card mb-3">
                  <div className="card-header"><span className="card-title">Top Districts by Complaints</span></div>
                  <div className="card-body" style={{ padding: 0 }}>
                    <div className="table-wrapper">
                      <table>
                        <thead><tr><th>District</th><th>Complaints</th><th>Share</th></tr></thead>
                        <tbody>
                          {stats.districtStats.map(d => (
                            <tr key={d._id}>
                              <td className="font-semibold">{d._id}</td>
                              <td>{d.count}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ height: 6, width: `${(d.count / stats.total * 100).toFixed(0)}%`, minWidth: 4, background: 'var(--primary)', borderRadius: 3 }} />
                                  <span className="text-xs text-muted">{(d.count / stats.total * 100).toFixed(1)}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {stats?.categoryStats?.length > 0 && (
                <div className="card">
                  <div className="card-header"><span className="card-title">Issues by Category</span></div>
                  <div className="card-body" style={{ padding: 0 }}>
                    <div className="table-wrapper">
                      <table>
                        <thead><tr><th>Issue Category</th><th>Count</th></tr></thead>
                        <tbody>
                          {stats.categoryStats.map(c => (
                            <tr key={c._id}><td>{c._id}</td><td className="font-semibold">{c.count}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Complaints */}
          {activeTab === 'complaints' && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2>All Complaints ({total})</h2>
              </div>
              <div className="filter-bar">
                <select className="form-control" value={filter.status} onChange={e => { setFilter(f => ({ ...f, status: e.target.value })); setPage(1); }}>
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <input className="form-control" placeholder="Filter by district..." value={filter.district} onChange={e => { setFilter(f => ({ ...f, district: e.target.value })); setPage(1); }} />
              </div>
              <div className="card">
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Ticket ID</th>
                        <th>Complainant</th>
                        <th>District</th>
                        <th>Facility</th>
                        <th>Issue</th>
                        <th>Status</th>
                        <th>Assigned To</th>
                        <th>Submitted</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complaints.length === 0 && (
                        <tr><td colSpan={9}><div className="empty-state"><div className="empty-icon">📭</div><div className="empty-title">No complaints found</div></div></td></tr>
                      )}
                      {complaints.map(c => (
                        <tr key={c._id}>
                          <td><span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '0.8rem', color: 'var(--primary)' }}>{c.ticketId}</span></td>
                          <td>
                            <div className="font-semibold text-sm">{c.userName}</div>
                            <div className="text-xs text-muted">{c.mobile}</div>
                          </td>
                          <td className="text-sm">{c.district}</td>
                          <td><div className="text-sm" style={{ maxWidth: 180 }}>{c.facilityName}<br /><span className="text-xs text-muted">{c.facilityType}</span></div></td>
                          <td className="text-sm" style={{ maxWidth: 160 }}>{Array.isArray(c.issueCategory) ? c.issueCategory.join(', ') : c.issueCategory}</td>
                          <td><StatusBadge status={c.status} /></td>
                          <td className="text-sm">{c.assignedTo?.name || <span className="text-muted">Unassigned</span>}</td>
                          <td className="text-xs text-muted" style={{ whiteSpace: 'nowrap' }}>{fmt(c.createdAt)}</td>
                          <td>
                            <div className="action-btns">
                              <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedComplaint(c); setModalData({ engineerId: c.assignedTo?._id || '' }); setModal('assign'); }}>Assign</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedComplaint(c); setModalData({ status: c.status, notes: '', otp: '' }); setStatusAwaitingOtp(false); setModal('status'); }}>Status</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {total > 15 && (
                  <div className="flex justify-between items-center" style={{ padding: '12px 16px', borderTop: '1px solid var(--gray-100)' }}>
                    <span className="text-sm text-muted">Page {page} of {Math.ceil(total / 15)}</span>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                      <button className="btn btn-ghost btn-sm" disabled={page >= Math.ceil(total / 15)} onClick={() => setPage(p => p + 1)}>Next →</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Engineers */}
          {activeTab === 'engineers' && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2>Manage Engineers</h2>
                <button className="btn btn-primary" onClick={() => setModal('newUser')}>+ Add User</button>
              </div>
              <div className="card">
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Assigned Districts</th><th>Status</th><th>Joined</th></tr></thead>
                    <tbody>
                      {users.filter(u => u.role === 'engineer').map(u => (
                        <tr key={u._id}>
                          <td className="font-semibold">{u.name}</td>
                          <td className="text-sm text-muted">{u.email}</td>
                          <td><span className="badge badge-open">{u.role}</span></td>
                          <td className="text-sm">{u.assignedDistricts?.join(', ') || 'All districts'}</td>
                          <td><span className={`badge ${u.isActive ? 'badge-resolved' : 'badge-closed'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                          <td className="text-xs text-muted">{fmt(u.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Seed Facilities */}
          {activeTab === 'seed' && (
            <div>
              <h2 className="mb-2">Seed Health Facilities</h2>
              <p className="text-muted mb-3">Paste your 666 facility JSON array below to load them into the database.</p>
              <div className="card">
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">Facility JSON Array</label>
                    <textarea className="form-control" rows={14} placeholder='[{"sno":1,"district":"Bokaro","facility_name":"...","facility_type":"DH","Lat ":23.61,"longitude":86.18,"facility_code":"..."}]' value={seedJson} onChange={e => setSeedJson(e.target.value)} style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem' }} />
                  </div>
                  <button className="btn btn-primary" onClick={handleSeed}>Upload Facilities</button>
                  {msg && <div className="alert alert-info mt-2">{msg}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Facility Notification Mapping */}
          {activeTab === 'mapping' && (
            <div>
              <h2 className="mb-2">Facility Notification Mapping</h2>
              <p className="text-muted mb-3">
                Map each health facility to its field engineer and team lead. State head and ops manager receive every complaint.
              </p>

              <div className="card mb-3">
                <div className="card-header"><span className="card-title">Always-notified Contacts</span></div>
                <div className="card-body">
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">State Head Name</label>
                      <input className="form-control" value={globalContacts.stateHeadName} onChange={e => setGlobalContacts(v => ({ ...v, stateHeadName: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State Head Email</label>
                      <input className="form-control" type="email" value={globalContacts.stateHeadEmail} onChange={e => setGlobalContacts(v => ({ ...v, stateHeadEmail: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State Head Mobile</label>
                      <input className="form-control" value={globalContacts.stateHeadMobile} onChange={e => setGlobalContacts(v => ({ ...v, stateHeadMobile: e.target.value }))} />
                    </div>
                    <div />
                    <div className="form-group">
                      <label className="form-label">Ops Manager Name</label>
                      <input className="form-control" value={globalContacts.opsManagerName} onChange={e => setGlobalContacts(v => ({ ...v, opsManagerName: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ops Manager Email</label>
                      <input className="form-control" type="email" value={globalContacts.opsManagerEmail} onChange={e => setGlobalContacts(v => ({ ...v, opsManagerEmail: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ops Manager Mobile</label>
                      <input className="form-control" value={globalContacts.opsManagerMobile} onChange={e => setGlobalContacts(v => ({ ...v, opsManagerMobile: e.target.value }))} />
                    </div>
                  </div>
                  <button className="btn btn-primary mt-2" onClick={handleSaveGlobalContacts} disabled={mappingLoading}>
                    {mappingLoading ? 'Saving...' : 'Save Global Contacts'}
                  </button>
                </div>
              </div>

              <div className="card mb-3">
                <div className="card-header"><span className="card-title">Map Facility to Engineer + Team Lead</span></div>
                <div className="card-body">
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">District</label>
                      <select className="form-control" value={mappingForm.district} onChange={e => setMappingForm(v => ({ ...v, district: e.target.value, facilityType: '', facilityCode: '', facilityName: '' }))}>
                        <option value="">Select district</option>
                        {districtOptions.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Facility Type</label>
                      <select className="form-control" value={mappingForm.facilityType} onChange={e => setMappingForm(v => ({ ...v, facilityType: e.target.value, facilityCode: '', facilityName: '' }))} disabled={!mappingForm.district}>
                        <option value="">Select type</option>
                        {facilityTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Health Facility</label>
                      <select className="form-control" value={mappingForm.facilityCode} onChange={e => {
                        const f = facilityOptions.find(x => x.facility_code === e.target.value);
                        setMappingForm(v => ({ ...v, facilityCode: e.target.value, facilityName: f?.facility_name || '' }));
                      }} disabled={!mappingForm.facilityType}>
                        <option value="">Select facility</option>
                        {facilityOptions.map(f => <option key={f.facility_code} value={f.facility_code}>{f.facility_name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Field Engineer Name</label>
                      <input className="form-control" value={mappingForm.engineerName} onChange={e => setMappingForm(v => ({ ...v, engineerName: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Field Engineer Email</label>
                      <input className="form-control" type="email" value={mappingForm.engineerEmail} onChange={e => setMappingForm(v => ({ ...v, engineerEmail: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Field Engineer Mobile</label>
                      <input className="form-control" value={mappingForm.engineerMobile} onChange={e => setMappingForm(v => ({ ...v, engineerMobile: e.target.value }))} />
                    </div>
                    <div />
                    <div className="form-group">
                      <label className="form-label">Team Lead Name</label>
                      <input className="form-control" value={mappingForm.teamLeadName} onChange={e => setMappingForm(v => ({ ...v, teamLeadName: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Team Lead Email</label>
                      <input className="form-control" type="email" value={mappingForm.teamLeadEmail} onChange={e => setMappingForm(v => ({ ...v, teamLeadEmail: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Team Lead Mobile</label>
                      <input className="form-control" value={mappingForm.teamLeadMobile} onChange={e => setMappingForm(v => ({ ...v, teamLeadMobile: e.target.value }))} />
                    </div>
                  </div>
                  <button className="btn btn-primary mt-2" onClick={handleSaveFacilityMapping} disabled={mappingLoading || !mappingForm.facilityCode}>
                    {mappingLoading ? 'Saving...' : 'Save Facility Mapping'}
                  </button>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><span className="card-title">Current Mappings</span></div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Facility</th>
                        <th>Engineer</th>
                        <th>Team Lead</th>
                        <th>Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(directory?.mappings || []).length === 0 && (
                        <tr><td colSpan={4}><div className="empty-state"><div className="empty-title">No mappings yet</div></div></td></tr>
                      )}
                      {(directory?.mappings || []).map(m => (
                        <tr key={m.facilityCode}>
                          <td>
                            <div className="font-semibold text-sm">{m.facilityName}</div>
                            <div className="text-xs text-muted">{m.district} · {m.facilityType} · {m.facilityCode}</div>
                          </td>
                          <td className="text-sm">
                            <div>{m.engineer?.name || '-'}</div>
                            <div className="text-xs text-muted">{m.engineer?.email || '-'}</div>
                            <div className="text-xs text-muted">{m.engineer?.mobile || '-'}</div>
                          </td>
                          <td className="text-sm">
                            <div>{m.teamLead?.name || '-'}</div>
                            <div className="text-xs text-muted">{m.teamLead?.email || '-'}</div>
                            <div className="text-xs text-muted">{m.teamLead?.mobile || '-'}</div>
                          </td>
                          <td className="text-xs text-muted">{fmt(m.updatedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Assign Modal */}
      {modal === 'assign' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Engineer</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-muted mb-2">Ticket: <strong>{selectedComplaint?.ticketId}</strong></p>
              <div className="form-group">
                <label className="form-label">Select Engineer</label>
                <select className="form-control" value={modalData.engineerId} onChange={e => setModalData(d => ({ ...d, engineerId: e.target.value }))}>
                  <option value="">-- Select Engineer --</option>
                  {engineers.map(e => <option key={e._id} value={e._id}>{e.name} ({e.assignedDistricts?.join(', ') || 'All'})</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssign} disabled={loading || !modalData.engineerId}>
                {loading ? <span className="spinner" /> : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {modal === 'status' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Status</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-muted mb-2">Ticket: <strong>{selectedComplaint?.ticketId}</strong></p>
              {selectedComplaint?.attachmentUrls?.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-muted font-semibold mb-1">Attachments</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selectedComplaint.attachmentUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--gray-200)' }} /></a>
                    ))}
                  </div>
                </div>
              )}
              {statusAwaitingOtp ? (
                <>
                  <div className="alert alert-info mb-3">
                    OTP has been sent to <strong>{selectedComplaint?.email}</strong>. Ask the complainant for the 6-digit code and enter it below.
                  </div>
                  <div className="form-group">
                    <label className="form-label">Enter OTP from Complainant</label>
                    <input className="form-control" placeholder="e.g. 123456" maxLength={6} value={modalData.otp || ''} onChange={e => setModalData(d => ({ ...d, otp: e.target.value.replace(/\D/g, '') }))} style={{ fontFamily: 'var(--mono)', letterSpacing: '0.2em', fontSize: '1.2rem' }} />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">New Status</label>
                    <select className="form-control" value={modalData.status} onChange={e => setModalData(d => ({ ...d, status: e.target.value }))}>
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-control" value={modalData.priority || ''} onChange={e => setModalData(d => ({ ...d, priority: e.target.value }))}>
                      <option value="">No change</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea className="form-control" rows={3} placeholder="Resolution notes or update..." value={modalData.notes} onChange={e => setModalData(d => ({ ...d, notes: e.target.value }))} />
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setModal(null); setStatusAwaitingOtp(false); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleStatus} disabled={loading || (statusAwaitingOtp && (modalData.otp || '').length !== 6)}>
                {loading ? <span className="spinner" /> : statusAwaitingOtp ? '✓ Confirm Resolution' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New User Modal */}
      {modal === 'newUser' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New User</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {['name', 'email', 'password'].map(field => (
                <div className="form-group" key={field}>
                  <label className="form-label" style={{ textTransform: 'capitalize' }}>{field}</label>
                  <input className="form-control" type={field === 'password' ? 'password' : 'text'} value={newUser[field]} onChange={e => setNewUser(u => ({ ...u, [field]: e.target.value }))} />
                </div>
              ))}
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-control" value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}>
                  <option value="engineer">Engineer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assigned Districts</label>
                <input className="form-control" placeholder="e.g. Bokaro, Dhanbad (comma separated)" value={newUser.assignedDistricts} onChange={e => setNewUser(u => ({ ...u, assignedDistricts: e.target.value }))} />
                <div className="form-hint">Leave empty to allow access to all districts</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleNewUser} disabled={loading}>
                {loading ? <span className="spinner" /> : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
