import React, { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { personalInfo } from '../../data/projects';
import useStore from '../../store/useStore';
import RotatingText from '../../components/RotatingText/RotatingText';
import './HeroSection.css';

const ease       = [0.22, 1, 0.36, 1];
const easeBounce = [0.34, 1.56, 0.64, 1];

// ─── Ink color — #282624 (darkest palette color, warm dark brown) ─────────────
const INK   = '#282624';
const INK2  = '#593322'; // flourish — warm brown from palette

// ─── Easing function: ease-in-out cubic ──────────────────────────────────────
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─────────────────────────────────────────────────────────────────────────────
//  WritingName — True SVG stroke-dashoffset handwriting animation
//
//  How it works:
//  1. SVG <text> starts with fill=transparent, stroke=ink, strokeDashoffset=LARGE
//  2. requestAnimationFrame loop decreases strokeDashoffset → 0 over 4.5s
//     using an ease-in-out cubic curve → letters are DRAWN stroke by stroke
//  3. A live <circle> ink-dot tracks the current drawing position using
//     textRef.getBoundingClientRect() + progress interpolation
//  4. When drawing finishes, fill-opacity transitions 0→1 over 0.9s
//     (letters "ink" into their full solid state)
//  5. A calligraphic flourish SVG path then draws itself via stroke-dashoffset
// ─────────────────────────────────────────────────────────────────────────────
function WritingName({ show }) {
  const svgRef         = useRef(null);
  const textRef        = useRef(null);
  const dotRef         = useRef(null);    // ink-dot SVG circle
  const flourishRef    = useRef(null);    // flourish <path>
  const rafRef         = useRef(null);
  const startTimeRef   = useRef(null);
  const totalLenRef    = useRef(8000);
  const fontReadyRef   = useRef(false); // true once Dancing Script is loaded
  const DURATION_MS    = 3000;          // matches 3D wave animation (~3s)

  // Eased progress driver via RAF
  const startDrawing = useCallback(() => {
    const textEl     = textRef.current;
    const dotEl      = dotRef.current;
    const svgEl      = svgRef.current;
    if (!textEl || !svgEl) return;

    // Get the true bounding box of the text (for dot positioning)
    const bbox = textEl.getBBox();

    startTimeRef.current = performance.now();

    const tick = (now) => {
      const elapsed  = now - startTimeRef.current;
      const raw      = Math.min(elapsed / DURATION_MS, 1);
      const eased    = easeInOutCubic(raw);

      // ── 1. Update stroke-dashoffset ──────────────────────────────────────
      const total    = totalLenRef.current;
      textEl.style.strokeDashoffset = `${total * (1 - eased)}`;

      // ── 2. Move the ink-dot cursor ────────────────────────────────────────
      // Interpolate along the text bounding box (left → right)
      // This is an approximation (true path-point needs getPointAtLength on path)
      // but for a horizontal text run it's visually accurate.
      if (dotEl) {
        // Map eased progress to an approximate x,y on the text stroke
        // For a cursive word the stroke follows a roughly sinusoidal path
        // We approximate this with a sine wave oscillation across the baseline
        const x = bbox.x + eased * bbox.width;
        // y oscillates slightly to simulate the natural cursive up/down stroke
        const y = bbox.y + bbox.height * 0.62
          + Math.sin(eased * Math.PI * 6) * (bbox.height * 0.18);

        // Convert SVG coords to screen coords via CTM
        try {
          const pt = svgEl.createSVGPoint();
          pt.x = x;
          pt.y = y;
          // Transform to screen then back to SVG root coords (already in SVG space)
          dotEl.setAttribute('cx', x);
          dotEl.setAttribute('cy', y);
          dotEl.style.opacity = raw < 0.97 ? '1' : '0';
        } catch (_) {}
      }

      if (raw < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // ── 3. Stroke complete → fade fill in ──────────────────────────────
        textEl.style.transition = 'fill-opacity 0.95s ease';
        textEl.style.fillOpacity = '1';

        // ── 4. Draw flourish after a short pause ───────────────────────────
        setTimeout(() => {
          const path = flourishRef.current;
          if (!path) return;
          const pLen = path.getTotalLength();
          path.style.strokeDasharray  = `${pLen}`;
          path.style.strokeDashoffset = `${pLen}`;
          path.getBoundingClientRect(); // force reflow
          path.style.transition =
            'stroke-dashoffset 1.3s cubic-bezier(0.22, 1, 0.36, 1)';
          path.style.strokeDashoffset = '0';
          // Flourish opacity
          path.parentElement.style.opacity = '1';
          path.parentElement.style.transition = 'opacity 0.1s';
        }, 220);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // ── PHASE 1: Preload font immediately on mount (before showContent) ──
  // This ensures zero wait when showContent fires and animation must start.
  useEffect(() => {
    document.fonts
      .load('700 120px "Dancing Script"')
      .then(() => {
        fontReadyRef.current = true;
        // If show is already true when font loads, measure and init
        const textEl = textRef.current;
        if (textEl && textEl.isConnected) {
          const len = textEl.getComputedTextLength();
          totalLenRef.current = Math.max(len * 3.5, 4000);
          textEl.style.strokeDasharray  = `${totalLenRef.current}`;
          textEl.style.strokeDashoffset = `${totalLenRef.current}`;
        }
      })
      .catch(() => { fontReadyRef.current = true; }); // fail-safe
  }, []);

  // ── PHASE 2: Start drawing when showContent becomes true ──
  // Font is almost certainly loaded by now (models take 800+700ms to load;
  // Dancing Script is ~50KB and loads in <500ms on broadband).
  useEffect(() => {
    if (!show) return;

    // Small safety guard — if font isn’t ready yet, wait for it;
    // otherwise start on the next frame (zero perceptible delay)
    const init = () => {
      const textEl = textRef.current;
      if (!textEl) return;
      const len = textEl.getComputedTextLength();
      totalLenRef.current = Math.max(len * 3.5, 4000);
      textEl.style.strokeDasharray  = `${totalLenRef.current}`;
      textEl.style.strokeDashoffset = `${totalLenRef.current}`;
      // Start immediately — no setTimeout gap
      requestAnimationFrame(startDrawing);
    };

    if (fontReadyRef.current) {
      // Font already loaded — init on next frame
      requestAnimationFrame(init);
    } else {
      // Rare case: still loading — wait then start
      document.fonts
        .load('700 120px "Dancing Script"')
        .then(init)
        .catch(init); // even on error, try to animate
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [show, startDrawing]);

  if (!show) return null;

  return (
    <div className="hn-wrap" aria-label={personalInfo.name}>

      {/* ── Main SVG: name drawn as stroked text ── */}
      <svg
        ref={svgRef}
        className="hn-svg"
        viewBox="0 0 680 140"
        xmlns="http://www.w3.org/2000/svg"
        overflow="visible"
        aria-hidden="true"
      >
        {/*
          The text element starts fully transparent (fill-opacity: 0)
          with a stroke that gets drawn via stroke-dashoffset animation.
          paint-order: stroke fill → stroke renders behind fill so the
          transition from outline → solid looks natural.
        */}
        <text
          ref={textRef}
          x="6"
          y="108"
          className="hn-text-path"
          style={{
            fontFamily: '"Dancing Script", "Brush Script MT", cursive',
            fontWeight: 700,
            fontSize: '120px',
            fill:            INK,
            fillOpacity:     0,           // starts hidden; JS fades to 1
            stroke:          INK,
            strokeWidth:     '1.4px',
            strokeLinecap:   'round',
            strokeLinejoin:  'round',
            paintOrder:      'stroke fill',
            // Initial dasharray/offset set by JS after font load
            strokeDasharray:  8000,
            strokeDashoffset: 8000,
          }}
        >
          {personalInfo.name}
        </text>

        {/*
          Ink dot cursor — SVG circle that tracks the active drawing position.
          Position updated per-frame by the RAF loop via setAttribute.
          Outer glow ring pulses to make it feel like wet ink.
        */}
        <circle
          ref={dotRef}
          r="4.5"
          fill={INK}
          style={{
            filter: 'drop-shadow(0 0 4px rgba(40,38,36,0.60))',
            transition: 'opacity 0.25s ease',
          }}
        />
        {/* Outer pulse ring (CSS animated) */}
        <circle
          className="hn-dot-ring"
          r="8"
          fill="none"
          stroke={INK}
          strokeWidth="1"
          style={{ opacity: 0 }}
          ref={(el) => {
            // keep the ring co-located with the dot via CSS animation
            if (el && dotRef.current) {
              // sync via shared parent transform — just link cx/cy
              const sync = () => {
                if (dotRef.current && el) {
                  el.setAttribute('cx', dotRef.current.getAttribute('cx') || 0);
                  el.setAttribute('cy', dotRef.current.getAttribute('cy') || 0);
                }
                requestAnimationFrame(sync);
              };
              sync();
            }
          }}
        />
      </svg>

      {/* ── Flourish SVG — calligraphic underline drawn after name finishes ── */}
      <svg
        className="hn-flourish-svg"
        viewBox="0 0 680 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        overflow="visible"
        aria-hidden="true"
        style={{ opacity: 0 }}
      >
        {/*
          Hand-designed calligraphic flourish path:
          starts left, flows in 3 waves rightward, ends with an upward flourish curl.
          stroke-dashoffset is driven by JS getTotalLength() after stroke finishes.
        */}
        <path
          ref={flourishRef}
          d={[
            'M 6 26',
            'C 75 10, 155 36, 235 20',    // 1st wave
            'C 315 4,  395 30, 475 16',    // 2nd wave
            'C 520 9,  555 26, 580 15',    // taper
            'Q 600 8  608 12',             // curl up
            'Q 614 16 610 21',             // curl back
          ].join(' ')}
          stroke={INK2}
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={{ strokeDasharray: 9999, strokeDashoffset: 9999 }}
        />
      </svg>
    </div>
  );
}

// ─── Main hero section ────────────────────────────────────────────────────────
export default function HeroSection() {
  const showContent = useStore((s) => s.showContent);

  return (
    <section id="home" className="hero-section">

      <div className="hero-vignette"   aria-hidden="true" />
      <div className="hero-floor-glow" aria-hidden="true" />

      <div className="hero-particles" aria-hidden="true">
        <div className="particle particle--1" />
        <div className="particle particle--2" />
        <div className="particle particle--3" />
        <div className="particle particle--4" />
        <div className="particle particle--5" />
      </div>

      {/* ── Left text column ── */}
      <motion.div
        className="hero-text"
        initial={{ opacity: 0, x: -50 }}
        animate={showContent ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.95, delay: 0.1, ease }}
      >
        {/* Cursive writing animation */}
        <WritingName show={showContent} />

        {/* Badge appears after animation finishes */}
        <motion.div
          className="hero-badge"
          initial={{ opacity: 0, scale: 0.72, y: 8 }}
          animate={showContent ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ duration: 0.58, delay: 3.4, ease: easeBounce }}
        >
          <span className="hero-badge__dot" aria-hidden="true" />
          <RotatingText
            texts={['AI ENGINEER', 'FULL-STACK DEV', 'UI DESIGNER']}
            mainClassName="hero-rotating-text"
            staggerFrom="last"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-120%", opacity: 0 }}
            staggerDuration={0.02}
            splitBy="characters"
            rotationInterval={2500}
          />
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="hero-scroll-hint"
        initial={{ opacity: 0 }}
        animate={showContent ? { opacity: 1 } : {}}
        transition={{ delay: 3.8, duration: 0.9 }}
        aria-label="Scroll down"
      >
        <div className="scroll-mouse">
          <div className="scroll-dot" />
        </div>
        <svg
          className="scroll-chevron"
          viewBox="0 0 14 9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <polyline points="1 1 7 8 13 1" />
        </svg>
      </motion.div>
    </section>
  );
}
