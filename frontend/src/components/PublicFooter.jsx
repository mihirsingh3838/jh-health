import { Link } from 'react-router-dom';

export default function PublicFooter() {
  return (
    <footer className="public-footer" role="contentinfo">
      <Link to="/login" className="public-footer-link">
        कर्मचारी प्रवेश · Staff access
      </Link>
    </footer>
  );
}
