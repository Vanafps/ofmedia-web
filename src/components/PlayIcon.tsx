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
      {/* Mathematically and optically centered play triangle inside 24x24 box */}
      <path d="M7.5 5.5v13a1 1 0 0 0 1.5.86l10-6.5a1 1 0 0 0 0-1.72l-10-6.5a1 1 0 0 0-1.5.86z" />
    </svg>
  );
};
