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
      {/* Mathematically and optically centered play triangle inside 24x24 circle */}
      <path d="M8 7.5v9c0 .77.83 1.25 1.5.87l7.5-4.5a1 1 0 0 0 0-1.74L9.5 6.63A1 1 0 0 0 8 7.5z" />
    </svg>
  );
};
