import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isNativeAndroid } from '../services/vkIdService';

export const OfmediaMobileAppNotice: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Don't show in native Android Capacitor shell or if already dismissed recently
    if (typeof window === 'undefined') return;
    if (isNativeAndroid()) return;

    const isMobileDevice =
      window.innerWidth < 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (!isMobileDevice) return;

    const dismissedAt = localStorage.getItem('ofmedia_mobile_app_notice_dismissed');
    if (dismissedAt) {
      const daysPassed = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysPassed < 3) return;
    }

    // Show with slight delay so initial load is clean
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem('ofmedia_mobile_app_notice_dismissed', String(Date.now()));
    } catch {}
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-3 right-3 sm:hidden z-[85] p-3.5 rounded-2xl bg-[#121214]/95 backdrop-blur-2xl border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.9)] flex items-center justify-between gap-3 select-none"
        >
          {/* Left Icon & Text */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#ff5c00]/20 border border-[#ff5c00]/30 flex items-center justify-center shrink-0 text-lg shadow-inner">
              📱
            </div>
            <div className="min-w-0">
              <div className="font-heading font-bold text-xs text-white leading-tight truncate">
                Скачайте мобильное приложение
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug mt-0.5 truncate">
                Так удобнее: оффлайн, PiP и 60 FPS
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/app"
              className="px-3.5 py-1.5 rounded-xl bg-[#ff5c00] hover:bg-[#e05200] text-white text-xs font-semibold shadow-md shadow-[#ff5c00]/30 active:scale-95 transition-all"
            >
              Скачать
            </a>
            <button
              onClick={handleDismiss}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white flex items-center justify-center text-xs transition-colors"
              title="Закрыть"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
