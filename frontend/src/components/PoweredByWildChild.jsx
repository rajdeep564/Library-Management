const WILDCHILD_URL = "https://www.wildchildstudios.com/";

export default function PoweredByWildChild({ variant = "footer" }) {
  return (
    <a
      href={WILDCHILD_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`footer-powered-by footer-powered-by--${variant}`}
      aria-label="Powered by WildChild Studios"
    >
      <span className="footer-powered-by-text">Powered by</span>
      <img src="/assets/wcs_logo.png" alt="WildChild Studios" className="footer-powered-by-logo" />
    </a>
  );
}
