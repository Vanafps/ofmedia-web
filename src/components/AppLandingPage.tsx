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
            <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
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
              <div className="w-12 h-12 rounded-2xl bg-[#0077FF]/10 border border-[#0077FF]/30 flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,119,255,0.25)]">
                <svg className="w-8 h-8" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M17.28 36C9.13414 36 5.0612 36 2.5306 33.4694C0 30.9388 0 26.8658 0 18.7199V17.2799C0 9.134 0 5.06105 2.5306 2.53046C5.0612 0 9.13413 0 17.28 0H18.72C26.8659 0 30.9388 0 33.4694 2.53046C36 5.06105 36 9.134 36 17.2799V18.7199C36 26.8658 36 30.9388 33.4694 33.4694C30.9388 36 26.8659 36 18.72 36H17.28Z" fill="#0077FF" />
                  <path d="M20.818 22.1855C19.8481 21.9432 19.168 21.0756 19.168 20.0805V8.35681C19.168 7.22652 20.236 6.39756 21.3377 6.67277L28.3144 8.41557C29.2843 8.65786 29.9644 9.5255 29.9644 10.5206V22.2443C29.9644 23.3746 28.8963 24.2035 27.7947 23.9283L20.818 22.1855Z" fill="white" />
                  <path d="M7.68519 27.5844C6.71525 27.3421 6.03516 26.4745 6.03516 25.4794V13.7557C6.03516 12.6254 7.1032 11.7965 8.20488 12.0717L15.1815 13.8145C16.1515 14.0568 16.8316 14.9244 16.8316 15.9195V27.6432C16.8316 28.7735 15.7635 29.6024 14.6618 29.3272L7.68519 27.5844Z" fill="white" />
                  <path d="M14.2516 24.8852C13.2817 24.6429 12.6016 23.7753 12.6016 22.7802V11.0565C12.6016 9.92621 13.6696 9.09724 14.7713 9.37245L21.7479 11.1153C22.7179 11.3575 23.398 12.2252 23.398 13.2203V24.944C23.398 26.0743 22.3299 26.9032 21.2283 26.628L14.2516 24.8852Z" fill="white" />
                  <path d="M18.8164 26.0288C18.5109 25.951 18.2934 25.6808 18.2827 25.3657L17.9792 16.4124C17.8914 15.2275 17.0118 14.285 16.0926 14.0075C16.041 13.9919 15.9859 14.0129 15.9554 14.0573C15.9243 14.1024 15.9363 14.1649 15.9796 14.1984C16.2066 14.3741 16.8313 14.9475 16.8313 15.9366L16.8295 25.5253L18.8164 26.0288Z" fill="#0077FF" />
                  <path d="M25.3828 23.3271C25.0776 23.2507 24.8599 22.9813 24.8492 22.6669L24.5456 13.7142C24.4579 12.5292 23.5782 11.5868 22.659 11.3092C22.6074 11.2937 22.5523 11.3147 22.5218 11.3591C22.4907 11.4042 22.5027 11.4666 22.546 11.5002C22.773 11.6759 23.3978 12.2493 23.3978 13.2383L23.3959 22.8303L25.3828 23.3271Z" fill="#0077FF" />
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
              <div className="text-[11px] text-zinc-500 font-mono">
                Версия 1.3.0 (Build 14) • ru.ofmedia.app
              </div>
            </div>

            <a
              href="https://www.rustore.ru/catalog/app/ru.ofmedia.app"
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#0077FF] hover:bg-[#0066DD] text-white font-semibold text-sm shadow-lg shadow-[#0077FF]/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.818 22.1855C19.8481 21.9432 19.168 21.0756 19.168 20.0805V8.35681C19.168 7.22652 20.236 6.39756 21.3377 6.67277L28.3144 8.41557C29.2843 8.65786 29.9644 9.5255 29.9644 10.5206V22.2443C29.9644 23.3746 28.8963 24.2035 27.7947 23.9283L20.818 22.1855Z" fill="white" />
                <path d="M7.68519 27.5844C6.71525 27.3421 6.03516 26.4745 6.03516 25.4794V13.7557C6.03516 12.6254 7.1032 11.7965 8.20488 12.0717L15.1815 13.8145C16.1515 14.0568 16.8316 14.9244 16.8316 15.9195V27.6432C16.8316 28.7735 15.7635 29.6024 14.6618 29.3272L7.68519 27.5844Z" fill="white" />
                <path d="M14.2516 24.8852C13.2817 24.6429 12.6016 23.7753 12.6016 22.7802V11.0565C12.6016 9.92621 13.6696 9.09724 14.7713 9.37245L21.7479 11.1153C22.7179 11.3575 23.398 12.2252 23.398 13.2203V24.944C23.398 26.0743 22.3299 26.9032 21.2283 26.628L14.2516 24.8852Z" fill="white" />
                <path d="M18.8164 26.0288C18.5109 25.951 18.2934 25.6808 18.2827 25.3657L17.9792 16.4124C17.8914 15.2275 17.0118 14.285 16.0926 14.0075C16.041 13.9919 15.9859 14.0129 15.9554 14.0573C15.9243 14.1024 15.9363 14.1649 15.9796 14.1984C16.2066 14.3741 16.8313 14.9475 16.8313 15.9366L16.8295 25.5253L18.8164 26.0288Z" fill="#0077FF" />
                <path d="M25.3828 23.3271C25.0776 23.2507 24.8599 22.9813 24.8492 22.6669L24.5456 13.7142C24.4579 12.5292 23.5782 11.5868 22.659 11.3092C22.6074 11.2937 22.5523 11.3147 22.5218 11.3591C22.4907 11.4042 22.5027 11.4666 22.546 11.5002C22.773 11.6759 23.3978 12.2493 23.3978 13.2383L23.3959 22.8303L25.3828 23.3271Z" fill="#0077FF" />
              </svg>
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
                Версия 1.3.0 (Build 14) • 97.2 МБ • ru.ofmedia.app
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
