export default function HomeHeroBanner() {
  return (
    <header className="home-hero" aria-label="Digital Swasthya Setu banner">
      <img
        src="/hero/dss-banner.png"
        alt="मुख्यमंत्री डिजिटल हेल्थ मिशन, डिजिटल स्वास्थ्य सेतु — BSNL, Government of Jharkhand, Ayushman Bharat Digital Mission"
        className="home-hero-img"
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />
    </header>
  );
}
