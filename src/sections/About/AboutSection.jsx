import React from 'react';
import { motion } from 'framer-motion';
import { personalInfo } from '../../data/projects';
import './AboutSection.css';

export default function AboutSection() {
  return (
    <section id="about" className="about-section">
      {/* Dark overlay so text is readable over the 3D hologram canvas */}
      <div className="about-overlay" aria-hidden="true" />

      {/* CSS grid floor lines */}
      <div className="about-grid" aria-hidden="true" />

      {/* Annotation cards — left side, pointing toward the 3D character */}
      <div className="about-annotations">
        <motion.div
          className="about-card"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.2, ease: [0.22,1,0.36,1] }}
        >
          <div className="about-card__dot" />
          <div className="about-card__line" />
          <div className="about-card__body">
            <strong className="about-card__name">{personalInfo.name}</strong>
            <span className="about-card__location">
              <svg viewBox="0 0 14 18" fill="currentColor" aria-hidden="true">
                <path d="M7 0a7 7 0 0 0-7 7c0 5.25 7 11 7 11s7-5.75 7-11A7 7 0 0 0 7 0zm0 9.5A2.5 2.5 0 1 1 7 4.5a2.5 2.5 0 0 1 0 5z"/>
              </svg>
              {personalInfo.location}
            </span>
          </div>
        </motion.div>

        <motion.div
          className="about-card about-card--bio"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.45, ease: [0.22,1,0.36,1] }}
        >
          <div className="about-card__dot" />
          <div className="about-card__line" />
          <div className="about-card__body">
            <p className="about-card__bio">{personalInfo.bio}</p>
          </div>
        </motion.div>
      </div>

      {/* Pedestal ID number */}
      <motion.p
        className="about-pedestal-num"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8 }}
        aria-hidden="true"
      >
        001
      </motion.p>
    </section>
  );
}
