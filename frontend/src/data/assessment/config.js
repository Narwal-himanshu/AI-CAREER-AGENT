// Central configuration for the 5-category "Career Discovery Journey" assessment.
// Icon names are strings (mapped to actual lucide-react components inside the
// components that render them) so this file stays framework-agnostic and easy
// to extend without touching JSX.

// Journey steps, in order. Adding a 6th category later = add one entry here.
export const ASSESSMENT_CATEGORIES = [
  { id: 'profile', label: 'Personal Profile', icon: 'User' },
  { id: 'goals', label: 'Career Goals', icon: 'Target' },
  { id: 'learning', label: 'Learning Style', icon: 'Brain' },
  { id: 'skills', label: 'Skill Assessment', icon: 'Cpu' },
  { id: 'personality', label: 'Personality & Motivation', icon: 'Compass' },
]

// Domains a student can select interest in during Career Goals. These exact
// string values are used as keys elsewhere in the app (Roadmap/Courses/DSA
// pages read profile.domain_interest), so DO NOT rename the `id` values —
// only `label`/`icon` are safe to change freely.
export const DOMAINS = [
  { id: 'DSA/CP', label: 'DSA & Competitive Programming', icon: 'Code2' },
  { id: 'Web Development', label: 'Web Development', icon: 'Terminal' },
  { id: 'AI/ML', label: 'AI / Machine Learning', icon: 'Brain' },
  { id: 'Cloud', label: 'Cloud / DevOps', icon: 'Cloud' },
  { id: 'CyberSec', label: 'Cybersecurity', icon: 'Shield' },
  { id: 'Mobile', label: 'Mobile Development', icon: 'Smartphone' },
]
