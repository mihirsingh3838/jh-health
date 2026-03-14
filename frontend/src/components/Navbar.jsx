import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const WifiIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M1.41 8.59C5.1 4.9 10.28 3 12 3s6.9 1.9 10.59 5.59l-1.42 1.41C17.9 6.63 14.12 5 12 5S6.1 6.63 2.83 10l-1.42-1.41zM12 17c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-5.66-2.34C7.78 13.22 9.83 12 12 12s4.22 1.22 5.66 2.66l1.41-1.41C17.34 11.34 14.8 10 12 10s-5.34 1.34-7.07 3.07l1.41 1.59z"/>
  </svg>
);

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo"><WifiIcon /></div>
          <div>
            <span className="navbar-title">JH Health WiFi Portal</span>
            <span className="navbar-subtitle">Jharkhand Health Department · BLUETOWN</span>
          </div>
        </Link>
        <div className="navbar-actions">
          {user ? (
            <>
              <span className="navbar-user">{user.name}</span>
              <span className="navbar-role">{user.role}</span>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{color:'white', borderColor:'rgba(255,255,255,0.3)'}}>
                Logout
              </button>
            </>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')} style={{color:'white', borderColor:'rgba(255,255,255,0.3)'}}>
              Staff Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
