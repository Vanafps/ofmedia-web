import React, { useState, useEffect, useRef } from 'react';
import {
  loginWithEmail,
  registerWithEmail,
  loginAsGuest,
  CINEMA_AVATARS,
  type UserProfile,
} from '../services/firebase';
import { loginWithVkId, renderVkOneTap } from '../services/vkIdService';

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

  useEffect(() => {
    if (!isOpen || !oneTapRef.current) return;
    renderVkOneTap(oneTapRef.current, (user) => {
      onSuccess(user);
      onClose();
    });
  }, [isOpen, onSuccess, onClose]);

  if (!isOpen) return null;

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

  const handleVkLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await loginWithVkId();
      onSuccess(user);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Ошибка входа через VK ID');
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
    <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#0e0e14]/90 backdrop-blur-3xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-[0_16px_50px_rgba(0,0,0,0.8)] z-10 space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
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
        <div className="flex p-1 bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-white/10">
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/70 border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-[#ff5c00] transition-colors"
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

          {/* Identifier Field (Username or Email) */}
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/70 border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-[#ff5c00] transition-colors"
            />
          </div>

          {/* Password Field with Show/Hide Toggle */}
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
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-zinc-900/70 border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-[#ff5c00] transition-colors"
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
            className="w-full py-3 rounded-xl bg-[#ff5c00] hover:bg-[#e05200] text-white font-semibold text-xs sm:text-sm shadow-lg shadow-[#ff5c00]/30 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
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

        {/* Official VK ID OneTap Container */}
        <div ref={oneTapRef} className="w-full flex justify-center empty:hidden" />

        {/* Alternative Actions: Guest & Direct VK Login */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={loading}
            className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-all active:scale-98"
          >
            <span>🍿</span>
            <span>Как гость</span>
          </button>

          <button
            type="button"
            onClick={handleVkLogin}
            disabled={loading}
            className="py-2.5 px-3 rounded-xl bg-[#0077ff]/15 hover:bg-[#0077ff]/25 border border-[#0077ff]/35 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm group"
          >
            <svg className="w-4 h-4 fill-[#0077ff] group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path d="M12.785 17.5c-4.437 0-6.965-3.037-7.072-8.087h2.215c.074 3.707 1.708 5.275 3.003 5.598V9.413h2.086v3.197c1.277-.138 2.607-1.587 3.06-3.197h2.086c-.35 2.012-1.835 3.46-2.88 4.07 1.045.49 2.705 1.758 3.322 4.017h-2.316c-.483-1.52-1.688-2.695-3.266-2.853v2.853h-.238z" />
            </svg>
            <span>VK ID</span>
          </button>
        </div>
      </div>
    </div>
  );
};
