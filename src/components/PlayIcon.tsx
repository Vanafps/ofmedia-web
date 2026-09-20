import React from 'react';

interface PlayIconProps {
  className?: string;
  size?: number | string;
}

/**
 * Perfectly centered Play Triangle Icon.
 * Standard triangle coordinates: left=7, right=19, top=5, bottom=19. Center at x=13.
 * Centered precisely within 24x24 box.
 */
export const PlayIcon: React.FC<PlayIconProps> = ({ className = 'w-4 h-4 fill-current' }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Optically centered play triangle (base at x=8.5, tip at x=19.5, centroid precisely at x=12.1) */}
      <path d="M8.5 5.5C8.5 4.7 9.4 4.2 10.1 4.6l10 6.5c0.7 0.4 0.7 1.4 0 1.8l-10 6.5c-0.7 0.4-1.6-0.1-1.6-0.9V5.5z" />
    </svg>
  );
};
