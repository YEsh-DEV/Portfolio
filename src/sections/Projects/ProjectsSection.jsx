import React from 'react';
import { motion } from 'framer-motion';
import ProjectCard from './ProjectCard';
import { projects } from '../../data/projects';
import RotatingText from '../../components/RotatingText/RotatingText';
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
          <h2 className="projects-section__title">
            <RotatingText
              texts={['Projects', 'Works', 'Creations', 'Concepts']}
              mainClassName="projects-rotating-text"
              staggerFrom="last"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.025}
              splitBy="characters"
              rotationInterval={3000}
            />
          </h2>
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
