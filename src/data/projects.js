/**
 * =====================================================
 *  PROJECTS DATA — Add / edit your projects here!
 * =====================================================
 *
 * To add a project, just add a new object to the array below.
 * Each project needs:
 *
 *  id          — unique string key (no spaces)
 *  title       — project display name
 *  description — one-line description shown on the card
 *  image       — path to thumbnail (put images in /public/images/)
 *  link        — URL to visit when clicking the card (use '#' if no link yet)
 *  tags        — array of tech/category labels shown as pills (optional)
 *  featured    — set true to show in a highlighted "featured" style (optional)
 *
 * =====================================================
 */

export const projects = [
  {
    id: 'project-1',
    title: 'Sample Project One',
    description: 'A beautiful full-stack web application with real-time features.',
    image: '/images/placeholder-1.webp',
    link: '#',
    tags: ['React', 'Node.js', 'MongoDB'],
    featured: true,
  },
  {
    id: 'project-2',
    title: 'Sample Project Two',
    description: 'Mobile-first e-commerce platform with seamless checkout.',
    image: '/images/placeholder-2.webp',
    link: '#',
    tags: ['Next.js', 'Stripe', 'Tailwind'],
    featured: false,
  },
  {
    id: 'project-3',
    title: 'Sample Project Three',
    description: 'Real-time collaborative tool built with WebSockets.',
    image: '/images/placeholder-3.webp',
    link: '#',
    tags: ['Socket.io', 'React', 'Express'],
    featured: false,
  },
  {
    id: 'project-4',
    title: 'Sample Project Four',
    description: 'AI-powered dashboard with data visualization and insights.',
    image: '/images/placeholder-4.webp',
    link: '#',
    tags: ['Python', 'FastAPI', 'D3.js'],
    featured: false,
  },
];

/**
 * Personal info used across sections.
 * Update these with your real details!
 */
export const personalInfo = {
  name: 'Yeshwanth',
  title: 'AI Engineer',
  location: 'India',
  bio: 'Builds interactive web experiences and full-stack systems that are fast, responsive, and fun to use.',
  email: ['atmakuriyeshwnath@gmail.com'],
  github: 'https://github.com/',
  linkedin: 'https://linkedin.com/in/',
  twitter: 'https://twitter.com/',
};
