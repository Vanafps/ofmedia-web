import React from 'react';

interface OfmediaMobileNavProps {
  activeTab: 'main' | 'favorites';
  setActiveTab: (tab: 'main' | 'favorites') => void;
  favoritesCount: number;
  onOpenSearch: () => void;
  onOpenProfile: () => void;
  isLoggedIn: boolean;
}

export const OfmediaMobileNav: React.FC<OfmediaMobileNavProps> = ({
  activeTab,
  setActiveTab,
  favoritesCount,
  onOpenSearch,
  onOpenProfile,
  isLoggedIn,
}) => {
  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-3xl border-t border-white/15 px-4 py-2 flex items-center justify-around select-none shadow-[0_-8px_30px_rgba(0,0,0,0.7)]">
      {/* 1. Главная */}
      <button
        onClick={() => {
          setActiveTab('main');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className={`flex flex-col items-center gap-1 p-1 transition-colors ${
          activeTab === 'main' ? 'text-[#ff5c00]' : 'text-zinc-400 hover:text-white'
        }`}
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
        <span className="text-[10px] font-medium">Главная</span>
      </button>

      {/* 2. Поиск */}
      <button
        onClick={onOpenSearch}
        className="flex flex-col items-center gap-1 p-1 text-zinc-400 hover:text-white transition-colors"
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 14z" />
        </svg>
        <span className="text-[10px] font-medium">Поиск</span>
      </button>

      {/* 3. Моё (Медиатека) */}
      <button
        onClick={() => {
          setActiveTab('favorites');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className={`relative flex flex-col items-center gap-1 p-1 transition-colors ${
          activeTab === 'favorites' ? 'text-[#ff5c00]' : 'text-zinc-400 hover:text-white'
        }`}
      >
        <div className="relative">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
          </svg>
          {favoritesCount > 0 && (
            <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-[#ff5c00] text-white text-[9px] font-bold flex items-center justify-center shadow">
              {favoritesCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium">Моё</span>
      </button>

      {/* 4. Профиль / Личный кабинет */}
      <button
        onClick={onOpenProfile}
        className="flex flex-col items-center gap-1 p-1 text-zinc-400 hover:text-white transition-colors"
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
        <span className="text-[10px] font-medium">{isLoggedIn ? 'Кабинет' : 'Войти'}</span>
      </button>
    </div>
  );
};
