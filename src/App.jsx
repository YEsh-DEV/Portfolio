import React, { useEffect } from 'react';

// Global components
import Navbar        from './components/Navigation/Navbar';
import CustomCursor  from './components/Cursor/CustomCursor';
import Loader        from './components/Loader/Loader';
import Footer        from './components/Footer/Footer';

// Three.js scene (fixed canvas behind everything)
import Scene         from './three/Scene';
import ErrorBoundary from './components/ErrorBoundary';

// HTML sections
import HeroSection     from './sections/Hero/HeroSection';
import AboutSection    from './sections/About/AboutSection';
import ProjectsSection from './sections/Projects/ProjectsSection';
import ContactSection  from './sections/Contact/ContactSection';

import useStore from './store/useStore';

/**
 * SectionBgManager — watches active section and applies
 * a CSS class to <body> so we can style section-specific
 * HTML overlays (e.g. dark background for About text).
 */
function SectionBgManager() {
  const activeSection = useStore((s) => s.activeSection);

  useEffect(() => {
    document.body.setAttribute('data-section', activeSection);
  }, [activeSection]);

  return null;
}

export default function App() {
  return (
    <>
      {/* Loading overlay */}
      <Loader />

      {/* Custom cursor */}
      <CustomCursor />

      {/* Sticky navigation */}
      <Navbar />

      {/* Background section manager */}
      <SectionBgManager />

      {/* Fixed Three.js Canvas — ErrorBoundary prevents WebGL crash killing the whole app */}
      <ErrorBoundary>
        <Scene />
      </ErrorBoundary>

      {/* Scrollable HTML sections layered above canvas */}
      <main className="main-scroll">
        <HeroSection />
        <AboutSection />
        <ProjectsSection />
        <ContactSection />
      </main>

      <Footer />
    </>
  );
}
