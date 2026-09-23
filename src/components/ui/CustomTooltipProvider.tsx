import React, { useEffect, useState, useRef } from 'react';

interface TooltipState {
  text: string;
  x: number;
  y: number;
  visible: boolean;
}

export const CustomTooltipProvider: React.FC = () => {
  const [isHoverSupported] = useState(() => {
    return typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  });

  const [tooltip, setTooltip] = useState<TooltipState>({
    text: '',
    x: 0,
    y: 0,
    visible: false,
  });

  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On touch/mobile devices, clean up title attributes so native tooltip bubbles never linger on tap
  useEffect(() => {
    if (isHoverSupported) return;
    const cleanupTitles = () => {
      document.querySelectorAll('[title]').forEach((el) => {
        const t = el.getAttribute('title');
        if (t) {
          el.setAttribute('data-no-tooltip', t);
          el.removeAttribute('title');
        }
      });
    };
    cleanupTitles();
    const observer = new MutationObserver(cleanupTitles);
    if (typeof document !== 'undefined' && document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
    return () => observer.disconnect();
  }, [isHoverSupported]);

  useEffect(() => {
    if (!isHoverSupported) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('[data-tooltip], [title]') as HTMLElement | null;
      if (!target) return;

      // Extract text from title or data-tooltip
      let text = target.getAttribute('data-tooltip');
      const nativeTitle = target.getAttribute('title');

      if (nativeTitle) {
        text = nativeTitle;
        target.setAttribute('data-tooltip', nativeTitle);
        target.removeAttribute('title'); // Prevent native browser tooltip from appearing!
      }

      if (!text || !text.trim()) return;

      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      showTimerRef.current = setTimeout(() => {
        const rect = target.getBoundingClientRect();
        const tooltipX = rect.left + rect.width / 2;
        const tooltipY = rect.top - 8; // positioned above target

        setTooltip({
          text,
          x: tooltipX,
          y: tooltipY,
          visible: true,
        });
      }, 120);
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('[data-tooltip]') as HTMLElement | null;
      if (!target) return;

      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
      setTooltip((prev) => ({ ...prev, visible: false }));
    };

    const handleScroll = () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    };

    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseout', handleMouseOut, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!tooltip.visible || !tooltip.text) return null;

  // Keep within screen boundaries
  const clampX = Math.max(70, Math.min(window.innerWidth - 70, tooltip.x));
  const isNearTop = tooltip.y < 45;
  const posY = isNearTop ? tooltip.y + 40 : tooltip.y;

  return (
    <div
      className="fixed z-[99999] pointer-events-none transition-all duration-150 transform -translate-x-1/2 -translate-y-full animate-in fade-in zoom-in-95"
      style={{
        left: `${clampX}px`,
        top: `${posY}px`,
      }}
    >
      <div className="px-3 py-1.5 rounded-xl bg-[#121215]/95 backdrop-blur-xl border border-white/18 text-zinc-100 text-[11px] sm:text-xs font-medium shadow-[0_10px_30px_rgba(0,0,0,0.9),0_0_1px_rgba(255,255,255,0.3)] whitespace-nowrap select-none">
        {tooltip.text}
        {/* Subtle arrow pointer */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-[#121215] border-white/18 transform rotate-45 ${
            isNearTop ? '-top-1 border-t border-l' : '-bottom-1 border-b border-r'
          }`}
        />
      </div>
    </div>
  );
};
