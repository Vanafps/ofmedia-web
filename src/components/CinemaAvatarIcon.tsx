import React from 'react';

export interface CinemaAvatarIconProps {
  id?: string | null;
  className?: string;
}

export const CinemaAvatarIcon: React.FC<CinemaAvatarIconProps> = ({ id, className = 'w-5 h-5' }) => {
  switch (id) {
    case 'director':
      // Clapperboard SVG
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 11h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z" fill="currentColor" fillOpacity="0.2" />
          <path d="m4 11 3-7h13l-3 7" />
          <path d="m9 4 3 7" />
          <path d="m14 4 3 7" />
        </svg>
      );
    case 'camera':
      // Film Camera SVG
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="23 7 16 12 23 17 23 7" fill="currentColor" fillOpacity="0.2" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" fill="currentColor" fillOpacity="0.2" />
        </svg>
      );
    case 'star':
      // Star SVG
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case 'mask':
      // Drama Mask SVG
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.15" />
          <path d="M8 15s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" />
          <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" />
        </svg>
      );
    case 'sound':
      // Headphones SVG
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" fill="currentColor" fillOpacity="0.2" />
        </svg>
      );
    case 'popcorn':
    default:
      // Film Reel / Ticket SVG
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2" fill="currentColor" fillOpacity="0.2" />
          <circle cx="12" cy="12" r="2" />
          <path d="M6 12h.01M18 12h.01" strokeWidth="3" />
        </svg>
      );
  }
};
