import React from 'react';

export type GenreCategoryId = 'none' | 'new' | 'comedy' | 'music' | 'shows' | 'adventure';

interface OfmediaGenreCardsProps {
  selectedCategory: GenreCategoryId;
  onSelectCategory: (id: GenreCategoryId) => void;
  counts: Record<GenreCategoryId, number>;
}

export const formatReleaseCount = (count: number): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return `${count} релизов`;
  if (mod10 === 1) return `${count} релиз`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} релиза`;
  return `${count} релизов`;
};

export const OfmediaGenreCards: React.FC<OfmediaGenreCardsProps> = ({
  selectedCategory,
  onSelectCategory,
  counts,
}) => {
  const handleToggle = (id: GenreCategoryId) => {
    if (selectedCategory === id) {
      onSelectCategory('none');
    } else {
      onSelectCategory(id);
      setTimeout(() => {
        const el = document.getElementById('catalog-results') || document.getElementById('catalog-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 60);
    }
  };

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20 space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-lg sm:text-xl text-white tracking-tight flex items-center gap-2">
          <span>Жанры</span>
          {selectedCategory !== 'none' && (
            <button
              onClick={() => onSelectCategory('none')}
              className="text-xs font-medium text-[#ff5c00] hover:text-[#ff7a29] transition-colors ml-2 bg-[#ff5c00]/10 hover:bg-[#ff5c00]/20 px-2.5 py-1 rounded-full border border-[#ff5c00]/30 flex items-center gap-1"
            >
              <span>✕</span>
              <span>Сбросить фильтр</span>
            </button>
          )}
        </h2>
      </div>

      {/* 5 Distinct Genre Cards with Frosted Glass and High-Personality Typography */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        {/* 1. Новое (Unbounded Font) */}
        <button
          onClick={() => handleToggle('new')}
          className={`relative group h-24 sm:h-28 rounded-2xl p-4 flex flex-col items-center justify-center overflow-hidden transition-all duration-300 border text-center ${
            selectedCategory === 'new'
              ? 'bg-[#00d2ff]/15 backdrop-blur-3xl border-[#00d2ff] ring-2 ring-[#00d2ff]/40 shadow-xl shadow-[#00d2ff]/20 scale-[1.02]'
              : 'bg-white/[0.05] backdrop-blur-3xl hover:bg-white/[0.09] border-white/15 hover:border-[#00d2ff]/50 hover:scale-[1.02] shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#00d2ff]/15 via-transparent to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />

          <div className="relative z-10 flex flex-col items-center">
            <span className="font-genre-new text-2xl sm:text-3xl text-white tracking-widest uppercase group-hover:text-[#00d2ff] transition-colors drop-shadow-[0_0_12px_rgba(0,210,255,0.4)] leading-none">
              Новое
            </span>
            <div className="w-10 h-0.5 bg-gradient-to-r from-transparent via-[#00d2ff] to-transparent mt-1" />
          </div>

          <span className="relative z-10 text-[10px] text-zinc-300 mt-1.5 font-normal">
            {formatReleaseCount(counts.new)} (2026)
          </span>
        </button>

        {/* 2. Комедии (Dela Gothic One Font) */}
        <button
          onClick={() => handleToggle('comedy')}
          className={`relative group h-24 sm:h-28 rounded-2xl p-4 flex flex-col items-center justify-center overflow-hidden transition-all duration-300 border text-center ${
            selectedCategory === 'comedy'
              ? 'bg-[#ff9900]/15 backdrop-blur-3xl border-[#ff9900] ring-2 ring-[#ff9900]/40 shadow-xl shadow-[#ff9900]/20 scale-[1.02]'
              : 'bg-white/[0.05] backdrop-blur-3xl hover:bg-white/[0.09] border-white/15 hover:border-[#ff9900]/50 hover:scale-[1.02] shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#ff9900]/15 via-transparent to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />

          <div className="relative z-10 flex flex-col items-center">
            <span className="font-genre-comedy text-xl sm:text-2xl text-white group-hover:text-[#ff9900] transition-colors drop-shadow-[0_0_10px_rgba(255,153,0,0.4)] leading-tight">
              Комедии
            </span>
            <div className="w-10 h-0.5 bg-gradient-to-r from-transparent via-[#ff9900] to-transparent mt-1" />
          </div>

          <span className="relative z-10 text-[10px] text-zinc-300 mt-1.5 font-normal">
            {formatReleaseCount(counts.comedy)}
          </span>
        </button>

        {/* 3. Музыкальные (Rhythmic Script Font) */}
        <button
          onClick={() => handleToggle('music')}
          className={`relative group h-24 sm:h-28 rounded-2xl p-4 flex flex-col items-center justify-center overflow-hidden transition-all duration-300 border text-center ${
            selectedCategory === 'music'
              ? 'bg-[#ff2a85]/15 backdrop-blur-3xl border-[#ff2a85] ring-2 ring-[#ff2a85]/40 shadow-xl shadow-[#ff2a85]/20 scale-[1.02]'
              : 'bg-white/[0.05] backdrop-blur-3xl hover:bg-white/[0.09] border-white/15 hover:border-[#ff2a85]/50 hover:scale-[1.02] shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#ff2a85]/15 via-transparent to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />

          <div className="relative z-10 flex flex-col items-center">
            <span className="font-genre-music text-xl sm:text-2xl text-white group-hover:text-[#ff2a85] transition-colors drop-shadow-[0_0_10px_rgba(255,42,133,0.4)] leading-tight">
              Музыкальные
            </span>
            <div className="w-10 h-0.5 bg-gradient-to-r from-transparent via-[#ff2a85] to-transparent mt-1" />
          </div>

          <span className="relative z-10 text-[10px] text-zinc-300 mt-1.5 font-normal">
            {formatReleaseCount(counts.music)}
          </span>
        </button>

        {/* 4. Шоу (Bebas Neue Font) */}
        <button
          onClick={() => handleToggle('shows')}
          className={`relative group h-24 sm:h-28 rounded-2xl p-4 flex flex-col items-center justify-center overflow-hidden transition-all duration-300 border text-center ${
            selectedCategory === 'shows'
              ? 'bg-[#ffd000]/15 backdrop-blur-3xl border-[#ffd000] ring-2 ring-[#ffd000]/40 shadow-xl shadow-[#ffd000]/20 scale-[1.02]'
              : 'bg-white/[0.05] backdrop-blur-3xl hover:bg-white/[0.09] border-white/15 hover:border-[#ffd000]/50 hover:scale-[1.02] shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#ffd000]/15 via-transparent to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />

          <div className="relative z-10 flex flex-col items-center">
            <span className="font-genre-shows text-2xl sm:text-3xl text-white group-hover:text-[#ffd000] transition-colors drop-shadow-[0_0_10px_rgba(255,208,0,0.4)] leading-none">
              Шоу
            </span>
            <div className="w-10 h-0.5 bg-gradient-to-r from-transparent via-[#ffd000] to-transparent mt-1" />
          </div>

          <span className="relative z-10 text-[10px] text-zinc-300 mt-1.5 font-normal">
            {formatReleaseCount(counts.shows)}
          </span>
        </button>

        {/* 5. Приключения (Russo One Font) */}
        <button
          onClick={() => handleToggle('adventure')}
          className={`relative group h-24 sm:h-28 rounded-2xl p-4 flex flex-col items-center justify-center overflow-hidden transition-all duration-300 border text-center col-span-2 sm:col-span-1 ${
            selectedCategory === 'adventure'
              ? 'bg-[#00ff88]/15 backdrop-blur-3xl border-[#00ff88] ring-2 ring-[#00ff88]/40 shadow-xl shadow-[#00ff88]/20 scale-[1.02]'
              : 'bg-white/[0.05] backdrop-blur-3xl hover:bg-white/[0.09] border-white/15 hover:border-[#00ff88]/50 hover:scale-[1.02] shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#00ff88]/15 via-transparent to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />

          <div className="relative z-10 flex flex-col items-center">
            <span className="font-genre-adventure text-sm sm:text-base text-white group-hover:text-[#00ff88] transition-colors drop-shadow-[0_0_10px_rgba(0,255,136,0.4)]">
              Приключения
            </span>
            <div className="w-10 h-0.5 bg-gradient-to-r from-transparent via-[#00ff88] to-transparent mt-1" />
          </div>

          <span className="relative z-10 text-[10px] text-zinc-300 mt-1.5 font-normal">
            {formatReleaseCount(counts.adventure)}
          </span>
        </button>
      </div>
    </section>
  );
};
