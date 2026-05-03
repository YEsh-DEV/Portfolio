import React from 'react';
import { motion } from 'framer-motion';
import { personalInfo } from '../../data/projects';
import './ContactSection.css';

const SOCIAL_LINKS = [
  {
    id: 'email',
    label: 'Send Email',
    href: `mailto:${personalInfo.email}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <polyline points="2,4 12,13 22,4"/>
      </svg>
    ),
  },
  {
    id: 'github',
    label: 'GitHub Profile',
    href: personalInfo.github,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 0a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2 0-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17 4.7 18 5 18 5c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 0z"/>
      </svg>
    ),
  },
  {
    id: 'linkedin',
    label: 'LinkedIn Profile',
    href: personalInfo.linkedin,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zm1.78 13.02H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/>
      </svg>
    ),
  },
  {
    id: 'twitter',
    label: 'Twitter / X Profile',
    href: personalInfo.twitter,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
];

export default function ContactSection() {
  return (
    <section id="contact" className="contact-section">
      <div className="contact-content">
        <motion.h2
          className="contact-heading"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
        >
          Let&apos;s build something<br />
          <span className="contact-heading__accent">together!</span>
        </motion.h2>

        <motion.div
          className="contact-socials"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22,1,0.36,1] }}
        >
          {SOCIAL_LINKS.map(({ id, label, href, icon }) => (
            <a
              key={id}
              id={`social-${id}`}
              href={href}
              className="contact-social-btn"
              aria-label={label}
              target={id !== 'email' ? '_blank' : undefined}
              rel={id !== 'email' ? 'noopener noreferrer' : undefined}
              data-interactive
            >
              {icon}
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
