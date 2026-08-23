import React, { useState } from 'react';
import { loginWithGoogle, loginWithEmail, registerWithEmail, type UserProfile } from '../services/firebase';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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
    if (!email || !password) {
      setError('Заполните все поля');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      let user: UserProfile;
      if (tab === 'login') {
        user = await loginWithEmail(email, password);
      } else {
        user = await registerWithEmail(email, password, name);
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
    <div className="fixed inset-0 z-[120] bg-black/65 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#0e0e14]/75 backdrop-blur-3xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <img src="/logos/ofmediawhite_clean.png" alt="OFMEDIA" className="h-6 w-auto object-contain" />
          </div>
          <h2 className="font-heading font-bold text-xl sm:text-2xl text-white">
            {tab === 'login' ? 'Вход в аккаунт' : 'Создать аккаунт'}
          </h2>
          <p className="text-xs text-zinc-400 font-normal">
            Сохраняйте историю просмотров, оценки и избранное на всех устройствах
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-zinc-900/60 backdrop-blur-md rounded-xl border border-white/10">
          <button
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              tab === 'login' ? 'bg-[#ff5c00] text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Войти
          </button>
          <button
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              tab === 'register' ? 'bg-[#ff5c00] text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Регистрация
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Google One-Click Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-medium text-xs sm:text-sm flex items-center justify-center gap-3 shadow-lg transition-transform active:scale-98"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          <span>Продолжить через Google</span>
        </button>

        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[11px] text-zinc-500 uppercase">или по почте</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'register' && (
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Имя</label>
              <input
                type="text"
                placeholder="Как вас зовут?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-[#ff5c00] transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Email</label>
            <input
              type="email"
              placeholder="example@mail.ru"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-[#ff5c00] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Пароль</label>
            <input
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-[#ff5c00] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#ff5c00] hover:bg-[#e05200] text-white font-medium text-xs sm:text-sm shadow-lg shadow-[#ff5c00]/30 transition-all active:scale-98 disabled:opacity-50"
          >
            {loading ? 'Секунду...' : tab === 'login' ? 'Войти в аккаунт' : 'Зарегистрироваться'}
          </button>
        </form>
      </div>
    </div>
  );
};
