// Polyfill for missing yearNav.js

export const YEAR_OPTIONS = [
  { slug: '1st-year', label: '1st Year', blurb: 'Explore and build foundations.', num: 1 },
  { slug: '2nd-year', label: '2nd Year', blurb: 'DSA and core theory.', num: 2 },
  { slug: '3rd-year', label: '3rd Year', blurb: 'Portfolio and real projects.', num: 3 },
  { slug: '4th-year', label: '4th Year', blurb: 'Placements.', num: 4 }
];

export const YEAR_SLUGS = YEAR_OPTIONS.map(y => y.slug);
export const ROADMAP_BASE_PATH = '/roadmap';

export function isYearActive(pathname, slug) {
  return pathname.includes(slug);
}

export function isRoadmapSection(pathname) {
  return pathname.startsWith(ROADMAP_BASE_PATH);
}

export function roadmapPathForSlug(slug) {
  return `${ROADMAP_BASE_PATH}/${slug}`;
}

export function getYearBySlug(slug) {
  return YEAR_OPTIONS.find(y => y.slug === slug);
}
