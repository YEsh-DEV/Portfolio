import React from 'react';
import './Footer.css';

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="footer" role="contentinfo">
      {/* Back to top */}
      <button
        className="footer__top-btn"
        onClick={scrollToTop}
        aria-label="Back to top"
        data-interactive
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <line x1="12" y1="19" x2="12" y2="5"/>
          <polyline points="5 12 12 5 19 12"/>
        </svg>
      </button>

      <div className="footer__links">
        <a href="#" data-interactive>Privacy</a>
        <span aria-hidden="true">·</span>
        <a href="#" data-interactive>Legal Notice</a>
      </div>

      <p className="footer__credit">
        © {new Date().getFullYear()} Yeshwanth
      </p>
    </footer>
  );
}
