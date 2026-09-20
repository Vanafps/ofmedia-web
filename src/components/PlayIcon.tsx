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
      {/* True optical center inside circular buttons */}
      <path d="M8 5.14v13.72a1 1 0 0 0 1.55.83l11-6.86a1 1 0 0 0 0-1.66l-11-6.86A1 1 0 0 0 8 5.14z" />
    </svg>
  );
};
