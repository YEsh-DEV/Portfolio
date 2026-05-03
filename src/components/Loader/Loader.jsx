import React, { useEffect } from 'react';
import useStore from '../../store/useStore';
import './Loader.css';

export default function Loader() {
  const isLoading = useStore((s) => s.isLoading);
  const loadProgress = useStore((s) => s.loadProgress);

  // Prevent body scroll while loading
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isLoading]);

  return (
    <div className={`loader ${!isLoading ? 'loader--done' : ''}`} role="status" aria-live="polite">
      <div className="loader-inner">
        {/* Name letters */}
        <div className="loader-name" aria-label="Loading Yeshwanth's portfolio">
          {'Yeshwanth'.split('').map((char, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.07}s` }}>{char}</span>
          ))}
        </div>

        {/* Progress bar */}
        <div className="loader-bar-track">
          <div className="loader-bar-fill" style={{ width: `${loadProgress}%` }} />
        </div>

        <p className="loader-pct">{Math.round(loadProgress)}%</p>
      </div>
    </div>
  );
}
