import React from 'react';
import { motion } from 'framer-motion';
import ProjectCard from './ProjectCard';
import { projects } from '../../data/projects';
import './ProjectsSection.css';

export default function ProjectsSection() {
  return (
    <section id="projects" className="projects-section html-section">
      <div className="projects-section__inner">

        {/* Section Header */}
        <motion.div
          className="projects-section__header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <span className="section-badge">Selected</span>
          <h2 className="projects-section__title">Projects</h2>
        </motion.div>

        {/* Project Grid — auto-renders from projects.js */}
        <div className="projects-section__grid">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.id}
              title={project.title}
              description={project.description}
              image={project.image}
              link={project.link}
              tags={project.tags}
              index={index}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
