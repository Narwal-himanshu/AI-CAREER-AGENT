import React from 'react';
import { useInView } from '../hooks/useInView';

export function Reveal({ children, delay = 0, className = '' }) {
  const { ref, isInView } = useInView();

  // Cap max delay for large lists
  const cappedDelay = Math.min(delay, 500);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isInView
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-6'
      } ${className}`}
      style={{ transitionDelay: `${cappedDelay}ms` }}
    >
      {children}
    </div>
  );
}
