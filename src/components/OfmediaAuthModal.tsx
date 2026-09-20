import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  loginWithEmail,
  registerWithEmail,
  loginAsGuest,
  CINEMA_AVATARS,
  type UserProfile,
} from '../services/firebase';
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
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('popcorn');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const oneTapRef = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef(onSuccess);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onCloseRef.current = onClose;
  }, [onSuccess, onClose]);

  // Render official VK ID widget only once when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const container = oneTapRef.current;
    if (!container) return;

    // Critical: clear previous widgets to avoid duplicate buttons
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
        (oneTapInstance as any)?.destroy?.();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Заполните все обязательные поля');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      let user: UserProfile;
      if (tab === 'login') {
        user = await loginWithEmail(identifier, password);
      } else {
        user = await registerWithEmail(identifier, password, name, selectedAvatar);
      }
      onSuccess(user);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Ошибка авторизации');
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

          {/* Modal Window: Pure Cinematic Dark (No Blue Cast) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-md bg-[#101012] border border-white/12 rounded-3xl p-6 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.95),0_0_1px_rgba(255,255,255,0.2)] z-10 space-y-5"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-colors text-xs"
              title="Закрыть (Esc)"
            >
              ✕
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
                {tab === 'login' ? 'Вход в кинотеатр' : 'Создание аккаунта'}
              </h2>
              <p className="text-xs text-zinc-400 font-normal">
                История просмотров, персональные оценки и закладки
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex p-1 bg-[#18181b] rounded-2xl border border-white/8">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                  tab === 'login'
                    ? 'bg-[#ff5c00] text-white shadow-md shadow-[#ff5c00]/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Войти
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                  tab === 'register'
                    ? 'bg-[#ff5c00] text-white shadow-md shadow-[#ff5c00]/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Регистрация
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-start gap-2 animate-in fade-in">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {tab === 'register' && (
                <>
                  {/* Name Field */}
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                      Имя или никнейм
                    </label>
                    <input
                      type="text"
                      placeholder="Как к вам обращаться?"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-[#ff5c00] transition-colors"
                    />
                  </div>

                  {/* Avatar Selector */}
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
                      Выберите кино-аватарку:
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {CINEMA_AVATARS.map((av) => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setSelectedAvatar(av.id)}
                          className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border ${
                            selectedAvatar === av.id
                              ? 'border-[#ff5c00] bg-[#ff5c00]/20 scale-105 shadow-md shadow-[#ff5c00]/30'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                          title={av.label}
                        >
                          <span className="text-xl">{av.emoji}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Identifier Field */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Логин или Email
                </label>
                <input
                  type="text"
                  placeholder={tab === 'login' ? 'Ваш логин или email' : 'Придумайте логин или введите email'}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-[#ff5c00] transition-colors"
                />
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-zinc-400">
                    Пароль
                  </label>
                  {tab === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!identifier.trim()) {
                          setError('Введите логин выше, чтобы получить доступ');
                          return;
                        }
                        setError('Для сброса пароля зарегистрируйте аккаунт заново или войдите как гость.');
                      }}
                      className="text-[11px] text-zinc-400 hover:text-[#ff5c00] transition-colors"
                    >
                      Забыли пароль?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#18181b] border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-[#ff5c00] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors text-xs"
                    title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    {showPassword ? '👁️' : '🔒'}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#ff5c00] hover:bg-[#e05200] text-white font-semibold text-xs sm:text-sm shadow-lg shadow-[#ff5c00]/30 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Секунду...' : tab === 'login' ? 'Войти в аккаунт' : 'Создать аккаунт'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">быстрый вход</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Single Official VK ID OneTap Container */}
            <div
              ref={oneTapRef}
              className="w-full min-h-[44px] flex items-center justify-center empty:hidden"
            />

            {/* Direct VK ID Fallback Button (visible if OneTap iframe fails to mount) */}
            <button
              type="button"
              onClick={() => loginWithVkId()}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0077FF]/15 hover:bg-[#0077FF]/25 border border-[#0077FF]/30 text-white text-xs font-semibold flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.602 17.502h-1.782c-.675 0-.882-.537-2.096-1.758-1.058-1.03-1.528-1.162-1.788-1.162-.366 0-.472.105-.472.61v1.65c0 .44-.14.71-1.303.71-1.922 0-4.053-1.164-5.558-3.33-2.268-3.197-2.888-5.61-2.888-6.108 0-.27.106-.52.61-.52h1.782c.453 0 .62.208.795.7 1.012 2.94 2.705 5.518 3.402 5.518.263 0 .384-.12.384-.783V11.23c-.08-.985-.576-1.07-.576-1.42 0-.175.148-.35.39-.35h2.46c.334 0 .452.176.452.574v3.522c0 .383.167.51.278.51.222 0 .408-.127.818-.538 1.258-1.412 2.158-3.52 2.158-3.52.12-.262.33-.548.784-.548h1.783c.537 0 .652.278.537.66-.214.992-2.3 3.938-2.39 4.07-.202.29-.278.42 0 .794.198.27 1.756 1.71 2.213 2.502.457.79.255 1.066-.43 1.066z" />
              </svg>
              <span>Войти через VK ID</span>
            </button>

            {/* Alternative: Guest login */}
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/8 text-zinc-400 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
            >
              <span>🍿</span>
              <span>Продолжить просмотр как гость</span>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
