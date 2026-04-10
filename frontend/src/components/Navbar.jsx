export default function Navbar() {
  return (
    <nav className="navbar" aria-label="Main">
      <div className="navbar-inner navbar-inner--public navbar-inner--minimal">
        <img
          src="/hero/dss-banner.png"
          alt="Digital Health Initiative banner"
          className="navbar-desktop-hero"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </div>
    </nav>
  );
}
