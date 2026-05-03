import React from 'react';
import { motion } from 'framer-motion';
import './ProjectCard.css';

/**
 * ProjectCard — reusable card component for the Projects section.
 *
 * Props:
 *  title       string   — project name
 *  description string   — one-liner shown below the title
 *  image       string   — path to the thumbnail image
 *  link        string   — URL to open on click
 *  tags        string[] — optional tech stack tags
 *  index       number   — used for staggered animation delay
 */
export default function ProjectCard({ title, description, image, link, tags = [], index = 0 }) {
  return (
    <motion.article
      className="project-card"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
    >
      <a
        href={link}
        className="project-card__link"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`View ${title} project`}
        data-interactive
      >
        {/* Thumbnail */}
        <div className="project-card__thumb">
          <img
            src={image}
            alt={`${title} thumbnail`}
            className="project-card__img"
            loading="lazy"
            onError={(e) => {
              // Fallback gradient if image not found
              e.target.style.display = 'none';
              e.target.parentElement.classList.add('project-card__thumb--fallback');
            }}
          />

          {/* Arrow CTA — slides in on hover */}
          <div className="project-card__arrow" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </div>

        {/* Card body */}
        <div className="project-card__body">
          <h3 className="project-card__title">{title}</h3>
          <p className="project-card__description">{description}</p>

          {/* Tags */}
          {tags.length > 0 && (
            <ul className="project-card__tags" aria-label="Technologies used">
              {tags.map((tag) => (
                <li key={tag} className="project-card__tag">{tag}</li>
              ))}
            </ul>
          )}
        </div>
      </a>
    </motion.article>
  );
}
