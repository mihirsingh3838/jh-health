import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
        <Link to="/" className="navbar-brand-cluster" aria-label="Home — Digital Swasthya Setu">
          <img src="/logos/bsnl.png" alt="BSNL" className="navbar-logo-img" />
          <div className="navbar-text-stack">
            <span className="navbar-title">डिजिटल स्वास्थ्य सेतु</span>
            <span className="navbar-subtitle">स्वास्थ्य और संचार, हर कदम आपके साथ</span>
          </div>
        </Link>

        <div className="navbar-trail">
          <Link to="/" className="navbar-logo-link" aria-label="Home — Digital Swasthya Setu">
            <img src="/logos/abdm.png" alt="ABDM" className="navbar-logo-img navbar-logo-img--trail" />
          </Link>
          {user && (
            <div className="navbar-actions navbar-actions--compact">
              <span className="navbar-user navbar-user--compact">{user.name}</span>
              <span className="navbar-role navbar-role--compact">{user.role}</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleLogout}
                style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
