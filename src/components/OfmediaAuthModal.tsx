import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loginAsGuest, type UserProfile } from '../services/firebase';
import { renderVkOneTap, loginWithVkId } from '../services/vkIdService';

interface OfmediaAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const OfmediaAuthModal: React.FC<OfmediaAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const oneTapRef = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef(onSuccess);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onCloseRef.current = onClose;
  }, [onSuccess, onClose]);

  // Render official VK ID SDK OneTap widget when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const container = oneTapRef.current;
    if (!container) return;

    // Clear previous widgets to avoid duplicate buttons
    container.innerHTML = '';

    const oneTapInstance = renderVkOneTap(
      container,
      (user) => {
        onSuccessRef.current(user);
        onCloseRef.current();
      },
      (err) => {
        console.warn('VK OneTap load notice:', err);
      }
    );

    return () => {
      if (container) {
        container.innerHTML = '';
      }
      try {
        (oneTapInstance as any)?.close?.();
      } catch {}
    };
  }, [isOpen]);

  const handleGuestLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await loginAsGuest();
      onSuccess(user);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Ошибка гостевого входа');
    } finally {
      setLoading(false);
    }
  };

  const handleVkLoginClick = async () => {
    try {
      setLoading(true);
      setError(null);
      await loginWithVkId();
    } catch (e: any) {
      setError(e?.message || 'Не удалось открыть авторизацию VK ID');
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 select-none">
          {/* Backdrop with smooth blur and fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-2xl"
          />

          {/* Modal Window: Pure Cinematic Dark */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="relative w-full max-w-md bg-[#101012] border border-white/12 rounded-3xl p-6 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.95),0_0_1px_rgba(255,255,255,0.2)] z-10 space-y-5"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-colors text-xs cursor-pointer"
              title="Закрыть (Esc)"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-1">
                <img
                  src="/logos/ofmediawhite_clean.png"
                  alt="OFMEDIA"
                  className="h-6 w-auto object-contain drop-shadow-[0_2px_8px_rgba(255,255,255,0.2)]"
                />
              </div>
              <h2 className="font-heading font-bold text-xl sm:text-2xl text-white">
                Вход в онлайн-кинотеатр
              </h2>
              <p className="text-xs text-zinc-400 font-normal leading-relaxed max-w-xs mx-auto">
                Авторизуйтесь через VK ID для доступа к истории просмотров, персональным оценкам и закладкам на всех устройствах
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-start gap-2 animate-in fade-in">
                <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
                  <circle cx="12" cy="16" r="1" fill="currentColor" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Official VK ID OneTap Container (LowCode Widget with 3-in-1: VK ID, Mail.ru, OK.ru) */}
            <div className="w-full flex flex-col items-center justify-center pt-2">
              <div
                ref={oneTapRef}
                className="w-full flex justify-center items-center min-h-[48px]"
              />
            </div>

            {/* Fallback Direct VK ID Button */}
            <button
              type="button"
              onClick={handleVkLoginClick}
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl bg-[#0077ff]/15 hover:bg-[#0077ff]/25 border border-[#0077ff]/40 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-md disabled:opacity-50"
            >
              <svg className="w-5 h-5 fill-[#0077ff]" viewBox="0 0 24 24">
                <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.602 17.502h-1.782c-.675 0-.882-.537-2.096-1.758-1.058-1.03-1.528-1.162-1.788-1.162-.366 0-.472.105-.472.61v1.65c0 .44-.14.71-1.303.71-1.922 0-4.053-1.164-5.558-3.33-2.268-3.197-2.888-5.61-2.888-6.108 0-.27.106-.52.61-.52h1.782c.453 0 .62.208.795.7 1.012 2.94 2.705 5.518 3.402 5.518.263 0 .384-.12.384-.783V11.23c-.08-.985-.576-1.07-.576-1.42 0-.175.148-.35.39-.35h2.46c.334 0 .452.176.452.574v3.522c0 .383.167.51.278.51.222 0 .408-.127.818-.538 1.258-1.412 2.158-3.52 2.158-3.52.12-.262.33-.548.784-.548h1.783c.537 0 .652.278.537.66-.214.992-2.3 3.938-2.39 4.07-.202.29-.278.42 0 .794.198.27 1.756 1.71 2.213 2.502.457.79.255 1.066-.43 1.066z" />
              </svg>
              <span>Войти через VK ID</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">или без профиля</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Prominent Guest Login Button */}
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-left transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-300 group-hover:text-white group-hover:bg-[#ff5c00]/20 group-hover:border-[#ff5c00]/30 transition-colors shrink-0">
                  <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-white group-hover:text-[#ff5c00] transition-colors">
                    Продолжить как гость
                  </div>
                  <div className="text-[11px] text-zinc-400 font-normal leading-tight">
                    Просмотр без создания профиля. История и оценки сохраняются локально.
                  </div>
                </div>
                <svg className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

