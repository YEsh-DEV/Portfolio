import React from 'react';
import { motion } from 'framer-motion';
import { personalInfo } from '../../data/projects';
import './HeroSection.css';

export default function HeroSection() {
  return (
    <section id="home" className="hero-section">
      {/* Blue edge vignette — CSS only */}
      <div className="hero-vignette" aria-hidden="true" />

      {/* Left-side text — sits over the canvas */}
      <motion.div
        className="hero-text"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="hero-name">
          {personalInfo.name.split('').map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              {char}
            </motion.span>
          ))}
        </h1>
        <motion.div
          className="hero-badge"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.1, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <span>{personalInfo.title}</span>
        </motion.div>

        <motion.p
          className="hero-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.3, ease: [0.22, 1, 0.36, 1] }}
        >
        </motion.p>
      </motion.div>

      {/* Scroll indicator at bottom center */}
      <motion.div
        className="hero-scroll-hint"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        aria-label="Scroll down"
      >
        <div className="scroll-mouse">
          <div className="scroll-dot" />
        </div>
        <svg className="scroll-chevron" viewBox="0 0 14 9" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <polyline points="1 1 7 8 13 1" />
        </svg>
      </motion.div>
    </section>
  );
}
