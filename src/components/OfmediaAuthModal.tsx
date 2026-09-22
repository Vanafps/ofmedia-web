import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loginAsGuest, loginWithEmail, registerWithEmail, type UserProfile } from '../services/firebase';
import { renderVkOneTap, loginWithVkId } from '../services/vkIdService';
import { isMobileApp } from '../services/platform';

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
  const [authMethod, setAuthMethod] = useState<'vk' | 'email'>('vk');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const oneTapRef = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef(onSuccess);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onCloseRef.current = onClose;
  }, [onSuccess, onClose]);

  // Render official VK ID SDK OneTap widget when modal opens and VK tab is active
  useEffect(() => {
    if (!isOpen || authMethod !== 'vk') return;

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
  }, [isOpen, authMethod]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      if (isRegisterMode) {
        const user = await registerWithEmail(emailInput, passwordInput, nameInput);
        onSuccess(user);
        onClose();
      } else {
        const user = await loginWithEmail(emailInput, passwordInput);
        onSuccess(user);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Ошибка авторизации по почте');
    } finally {
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
            className="relative w-full max-w-md bg-[#101012] border border-white/12 rounded-3xl p-6 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.95),0_0_1px_rgba(255,255,255,0.2)] z-10 space-y-4"
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
            <div className="text-center space-y-1.5">
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
                Сохраняйте историю просмотров, персональные оценки и закладки на всех устройствах
              </p>
            </div>

            {/* Auth Method Toggle Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-white/5 border border-white/8 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setAuthMethod('vk'); setError(null); }}
                className={`py-2 rounded-xl transition-all ${
                  authMethod === 'vk'
                    ? 'bg-[#0077ff]/25 text-white shadow-sm border border-[#0077ff]/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                VK ID & сервисы
              </button>
              <button
                type="button"
                onClick={() => { setAuthMethod('email'); setError(null); }}
                className={`py-2 rounded-xl transition-all ${
                  authMethod === 'email'
                    ? 'bg-white/15 text-white shadow-sm border border-white/20'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Почта и пароль
              </button>
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

            {/* Tab 1: Official VK ID OneTap Container */}
            {authMethod === 'vk' && (
              <div className="w-full flex flex-col items-center justify-center pt-1 min-h-[56px] space-y-3">
                <div
                  ref={oneTapRef}
                  className="w-full flex justify-center items-center"
                />
                {(isMobileApp() || (typeof window !== 'undefined' && window.innerWidth < 768)) && (
                  <button
                    type="button"
                    onClick={() => loginWithVkId()}
                    className="w-full py-3 px-4 rounded-2xl bg-[#0077ff] hover:bg-[#0066ee] text-white font-semibold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M15.684 0H8.316C3.592 0 0 3.592 0 8.316v7.368C0 20.408 3.592 24 8.316 24h7.368C20.408 24 24 20.408 24 15.684V8.316C24 3.592 20.408 0 15.684 0zm3.602 17.154h-1.634c-.618 0-.808-.492-1.921-1.61-.97-.946-1.4-.997-1.637-.997-.332 0-.427.094-.427.551v1.464c0 .393-.127.592-1.183.592-1.748 0-3.69-1.06-5.06-3.033-2.073-2.91-2.64-5.105-2.64-5.556 0-.25.095-.483.565-.483h1.634c.421 0 .577.193.738.65.805 2.338 2.152 4.385 2.709 4.385.209 0 .304-.095.304-.616V10.15c-.066-1.104-.648-1.198-.648-1.59 0-.19.16-.38.414-.38h2.57c.35 0 .474.184.474.6v3.238c0 .351.157.474.257.474.209 0 .38-.123.766-.51 1.18-1.326 2.023-3.292 2.023-3.292.11-.247.332-.47.753-.47h1.634c.49 0 .6.247.49.6-.208.97-2.228 3.82-2.327 3.974-.23.364-.32.527 0 .954.23.31 1.01 1.002 1.528 1.602.955 1.077 1.69 1.979 1.887 2.603.1.317-.07.48-.567.48z" />
                    </svg>
                    <span>Войти через VK ID</span>
                  </button>
                )}
              </div>
            )}

            {/* Tab 2: Email & Password Authentication */}
            {authMethod === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs pb-1">
                  <span className="text-zinc-400 font-medium">
                    {isRegisterMode ? 'Создание нового профиля' : 'Вход в существующий профиль'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsRegisterMode(!isRegisterMode)}
                    className="text-[#ff5c00] hover:underline font-semibold"
                  >
                    {isRegisterMode ? 'Уже есть аккаунт?' : 'Регистрация'}
                  </button>
                </div>

                {isRegisterMode && (
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Ваше имя"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-[#ff5c00] transition-colors"
                  />
                )}

                <input
                  type="text"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Email или логин"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-[#ff5c00] transition-colors"
                />

                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Пароль"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-[#ff5c00] transition-colors"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-[#ff5c00] hover:bg-[#ff6c1a] text-white text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow"
                >
                  {loading
                    ? 'Подождите...'
                    : isRegisterMode
                    ? 'Зарегистрироваться'
                    : 'Войти по почте'}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 py-0.5">
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
                <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-300 group-hover:text-white group-hover:bg-[#ff5c00]/20 group-hover:border-[#ff5c00]/30 transition-colors shrink-0">
                  <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
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

