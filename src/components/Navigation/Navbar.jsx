import React from 'react';
import useStore from '../../store/useStore';
import './Navbar.css';

const NAV_ITEMS = [
  { id: 'about',    label: 'About'    },
  { id: 'projects', label: 'Projects' },
  { id: 'contact',  label: 'Contact'  },
];

export default function Navbar() {
  const { activeSection, setActiveSection, isMuted, toggleMute } = useStore();

  const handleNavClick = (sectionId) => {
    setActiveSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveSection('home');
  };

  return (
    <header className="navbar" role="banner">
      {/* Logo — top left */}
      <button
        className="navbar__logo"
        onClick={scrollToTop}
        aria-label="Back to home"
        data-interactive
      >
        <div className="navbar__logo-cube">
          <span />
        </div>
      </button>

      {/* Center pill navigation */}
      <nav className="navbar__center" aria-label="Main navigation">
        <ul className="navbar__list" role="list">
          {NAV_ITEMS.map(({ id, label }) => (
            <li key={id}>
              <button
                id={`nav-${id}`}
                className={`navbar__item ${activeSection === id ? 'navbar__item--active' : ''}`}
                onClick={() => handleNavClick(id)}
                aria-current={activeSection === id ? 'page' : undefined}
                data-interactive
              >
                {label.toUpperCase()}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Right side */}
      <div className="navbar__right">
        <a
          href="#contact"
          className="navbar__cta"
          onClick={(e) => { e.preventDefault(); handleNavClick('contact'); }}
          data-interactive
        >
          Get In Touch
        </a>
        <button
          className={`navbar__audio ${isMuted ? 'navbar__audio--muted' : ''}`}
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute background music' : 'Mute background music'}
          data-interactive
        >
          {isMuted ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
