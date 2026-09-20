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
      {/* True optical center inside circular buttons: base at x=9.5, tip at x=20.5 */}
      <path d="M9.5 5.5C9.5 4.7 10.4 4.2 11.1 4.6l9.5 6.5c0.7 0.4 0.7 1.4 0 1.8l-9.5 6.5c-0.7 0.4-1.6-0.1-1.6-0.9V5.5z" />
    </svg>
  );
};
