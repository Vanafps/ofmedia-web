import React, { useState } from 'react';
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  loginAsGuest,
  CINEMA_AVATARS,
  type UserProfile,
} from '../services/firebase';

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

  if (!isOpen) return null;

  const handleGuestLogin = () => {
    try {
      setLoading(true);
      setError(null);
      const user = loginAsGuest();
      onSuccess(user);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Ошибка гостевого входа');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await loginWithGoogle();
      onSuccess(user);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Ошибка входа через Google');
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

        {/* Alternative Actions: Guest & Google */}
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
            onClick={handleGoogleLogin}
            disabled={loading}
            className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-all active:scale-98"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};
