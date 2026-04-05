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
      <div className="navbar-inner navbar-inner--public">
        <div className="navbar-public-wrap">
          <div className="navbar-logo-row">
            <div className="navbar-logo-cell navbar-logo-cell--left">
              <Link to="/" className="navbar-brand-left" aria-label="Home — Digital Swasthya Setu">
                <img src="/logos/bsnl.png" alt="BSNL" className="navbar-logo-img navbar-logo-img--bsnl" />
              </Link>
            </div>
            <div className="navbar-logo-cell navbar-logo-cell--center">
              <Link to="/" className="navbar-jharkhand-link" aria-label="Government of Jharkhand — Home">
                <img
                  src="/logos/jharkhand-banner.png"
                  alt="Government of Jharkhand"
                  className="navbar-jharkhand-banner"
                />
              </Link>
            </div>
            <div className="navbar-logo-cell navbar-logo-cell--right">
              <Link to="/" className="navbar-logo-link" aria-label="Home — Digital Swasthya Setu">
                <img src="/logos/abdm.png" alt="ABDM" className="navbar-logo-img navbar-logo-img--abdm" />
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

          <Link to="/" className="navbar-brand-mid" aria-label="Home — Digital Swasthya Setu">
            <span className="navbar-scheme-banner">मुख्यमंत्री डिजिटल हेल्थ मिशन</span>
            <span className="navbar-title-pill">
              <span className="navbar-title-text">डिजिटल स्वास्थ्य सेतु</span>
              <span className="navbar-pill-divider" />
              <span className="navbar-subtitle-inside">स्वास्थ्य और संचार, हर कदम आपके साथ</span>
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
