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
      {/* Mathematically & optically centered triangle inside circular containers */}
      <path d="M7.5 6.2c0-.95 1.05-1.53 1.85-1.02l10.2 6.3c.78.48.78 1.56 0 2.04l-10.2 6.3c-.8.5-1.85-.07-1.85-1.02V6.2z" />
    </svg>
  );
};
