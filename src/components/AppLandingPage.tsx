import React from 'react';

export const AppLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#08080a] text-white selection:bg-[#ff5c00] selection:text-white flex flex-col justify-between relative overflow-x-hidden">
      {/* Ambient background glow (warm cinema orange) */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#ff5c00]/12 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-[#ff5c00]/8 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navigation */}
      <header className="relative z-10 w-full border-b border-white/10 bg-[#08080a]/80 backdrop-blur-xl">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <a href="/" className="hover:opacity-90 transition-opacity">
            <img
              src="/logos/ofmediawhite_clean.png"
              alt="OFMEDIA"
              className="h-6 sm:h-7 w-auto object-contain drop-shadow-[0_2px_8px_rgba(255,255,255,0.2)]"
            />
          </a>
          <a
            href="/"
            className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs sm:text-sm font-medium text-zinc-300 hover:text-white transition-all flex items-center gap-2"
          >
            <span>←</span>
            <span>В онлайн-кинотеатр</span>
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex flex-col items-center text-center space-y-8 sm:space-y-12">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ff5c00]/15 border border-[#ff5c00]/30 text-xs font-semibold text-[#ff5c00] animate-in fade-in duration-300">
          <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M8 2h8a2 2 0 012 2v16a2 2 0 01-2 2H8a2 2 0 01-2-2V4a2 2 0 012-2z" />
          </svg>
          <span>Официальное приложение для Android</span>
        </div>

        {/* Heading */}
        <div className="space-y-4 max-w-2xl">
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight">
            Кинотеатр OFMEDIA в вашем кармане
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Смотрите премьеры, фильмы и сериалы в максимальном качестве 1080p, скачивайте для оффлайн-просмотра и используйте режим «Картинка в картинке».
          </p>
        </div>

        {/* Download Options Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 w-full max-w-3xl text-left">
          {/* Option 1: RuStore */}
          <div className="relative rounded-3xl bg-[#121214] border border-white/12 p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.85)] hover:border-[#ff5c00]/40 transition-all group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                </svg>
              </div>
              <div className="inline-block text-[11px] font-semibold text-[#ff5c00] uppercase tracking-wider">
                Рекомендуемый способ
              </div>
              <h3 className="font-heading font-bold text-xl sm:text-2xl text-white">
                Установить из RuStore
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Официальный российский магазин приложений. Автоматические обновления, проверенная безопасность и быстрая установка в 1 клик.
              </p>
            </div>

            <a
              href="https://www.rustore.ru/catalog/app/ru.ofmedia.app"
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#ff5c00] hover:bg-[#e05200] text-white font-semibold text-sm shadow-lg shadow-[#ff5c00]/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>Установить в RuStore</span>
              <span>→</span>
            </a>
          </div>

          {/* Option 2: Direct APK */}
          <div className="relative rounded-3xl bg-[#121214] border border-white/12 p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.85)] hover:border-white/25 transition-all group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <div className="inline-block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Прямая загрузка
              </div>
              <h3 className="font-heading font-bold text-xl sm:text-2xl text-white">
                Скачать APK напрямую
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Официальный релизный установочный файл без магазинов приложений. Подходит для смартфонов, планшетов и Android TV.
              </p>
              <div className="text-[11px] text-zinc-500 font-mono">
                Версия 1.0.1 • 82.5 МБ • ru.ofmedia.app
              </div>
            </div>

            <a
              href="/apk"
              className="w-full py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Скачать APK файл</span>
            </a>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="w-full max-w-3xl pt-6">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-6">
            Преимущества мобильного приложения
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
            <div className="p-4 rounded-2xl bg-[#121214] border border-white/10 space-y-2 flex flex-col items-center">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#ff5c00]">
                <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div className="font-semibold text-xs text-white">Оффлайн</div>
              <p className="text-[11px] text-zinc-400">Сохраняйте в память</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#121214] border border-white/10 space-y-2 flex flex-col items-center">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#ff5c00]">
                <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="font-semibold text-xs text-white">PiP режим</div>
              <p className="text-[11px] text-zinc-400">Кино поверх окон</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#121214] border border-white/10 space-y-2 flex flex-col items-center">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#ff5c00]">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div className="font-semibold text-xs text-white">Плавность</div>
              <p className="text-[11px] text-zinc-400">Стабильные 60 FPS</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#121214] border border-white/10 space-y-2 flex flex-col items-center">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#ff5c00]">
                <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
              <div className="font-semibold text-xs text-white">Без рекламы</div>
              <p className="text-[11px] text-zinc-400">Мгновенный старт</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-white/10 bg-[#08080a] py-6 text-center text-xs text-zinc-500">
        <div className="max-w-[1280px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-zinc-400">OFMEDIA • Все права защищены</div>
          <a href="/" className="text-[#ff5c00] hover:underline">
            Перейти к веб-версии кинотеатра →
          </a>
        </div>
      </footer>
    </div>
  );
};
