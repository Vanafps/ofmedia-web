import React, { useState, useRef, useEffect } from 'react';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 150,
  className = '',
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = () => {
    if (disabled || !content) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[#181822] border-x-transparent border-b-transparent border-4',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[#181822] border-x-transparent border-t-transparent border-4',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[#181822] border-y-transparent border-r-transparent border-4',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[#181822] border-y-transparent border-l-transparent border-4',
  };

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}

      {isVisible && (
        <div
          role="tooltip"
          className={`absolute ${positionClasses[position]} z-[9999] pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95`}
        >
          <div className="relative px-2.5 py-1 rounded-lg bg-[#181822]/95 backdrop-blur-md border border-white/15 text-zinc-100 text-[11px] font-medium shadow-[0_8px_24px_rgba(0,0,0,0.85)] whitespace-nowrap select-none">
            {content}
            <div className={`absolute w-0 h-0 ${arrowClasses[position]}`} />
          </div>
        </div>
      )}
    </div>
  );
};
