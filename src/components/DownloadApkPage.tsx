import React, { useEffect, useState } from 'react';

export const DownloadApkPage: React.FC = () => {
  const [downloadTriggered, setDownloadTriggered] = useState(false);

  useEffect(() => {
    // Instant automatic download
    const timer = setTimeout(() => {
      triggerDownload();
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  const triggerDownload = () => {
    setDownloadTriggered(true);
    const link = document.createElement('a');
    link.href = '/ofmedia-latest.apk';
    link.download = 'OFMEDIA.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Ambient background glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#ff5c00]/12 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#ff5c00]/8 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full bg-[#101012] border border-white/12 rounded-3xl p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.95)] text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Logo */}
        <div className="flex justify-center">
          <a href="/" className="hover:opacity-90 transition-opacity">
            <img
              src="/logos/ofmediawhite_clean.png"
              alt="OFMEDIA"
              className="h-8 w-auto object-contain drop-shadow-[0_2px_12px_rgba(255,255,255,0.25)]"
            />
          </a>
        </div>

        {/* Animated Download / Android Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ff5c00] to-[#e05200] flex items-center justify-center shadow-xl shadow-[#ff5c00]/30 animate-in zoom-in duration-300">
          <svg className="w-10 h-10 text-white animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>

        {/* Heading & Status */}
        <div className="space-y-2">
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-white">
            OFMEDIA для Android
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300">
            {downloadTriggered
              ? 'Загрузка файла APK началась автоматически...'
              : 'Подготовка официального релиза к загрузке...'}
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-zinc-400">
            <span>Пакет: ru.ofmedia.app</span>
            <span>•</span>
            <span>Версия 1.3.0 (Build 14)</span>
            <span>•</span>
            <span>97.2 МБ</span>
          </div>
        </div>

        {/* Manual Download Button if browser blocked auto-download */}
        <div className="space-y-3 pt-2">
          <button
            onClick={triggerDownload}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#ff5c00] hover:bg-[#e05200] text-white font-semibold text-sm shadow-lg shadow-[#ff5c00]/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Скачать APK повторно</span>
          </button>

          <a
            href="https://www.rustore.ru/catalog/app/ru.ofmedia.app"
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 px-6 rounded-2xl bg-[#0077FF]/15 hover:bg-[#0077FF]/25 border border-[#0077FF]/30 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M17.28 36C9.13414 36 5.0612 36 2.5306 33.4694C0 30.9388 0 26.8658 0 18.7199V17.2799C0 9.134 0 5.06105 2.5306 2.53046C5.0612 0 9.13413 0 17.28 0H18.72C26.8659 0 30.9388 0 33.4694 2.53046C36 5.06105 36 9.134 36 17.2799V18.7199C36 26.8658 36 30.9388 33.4694 33.4694C30.9388 36 26.8659 36 18.72 36H17.28Z" fill="#0077FF" />
              <path d="M20.818 22.1855C19.8481 21.9432 19.168 21.0756 19.168 20.0805V8.35681C19.168 7.22652 20.236 6.39756 21.3377 6.67277L28.3144 8.41557C29.2843 8.65786 29.9644 9.5255 29.9644 10.5206V22.2443C29.9644 23.3746 28.8963 24.2035 27.7947 23.9283L20.818 22.1855Z" fill="white" />
              <path d="M7.68519 27.5844C6.71525 27.3421 6.03516 26.4745 6.03516 25.4794V13.7557C6.03516 12.6254 7.1032 11.7965 8.20488 12.0717L15.1815 13.8145C16.1515 14.0568 16.8316 14.9244 16.8316 15.9195V27.6432C16.8316 28.7735 15.7635 29.6024 14.6618 29.3272L7.68519 27.5844Z" fill="white" />
              <path d="M14.2516 24.8852C13.2817 24.6429 12.6016 23.7753 12.6016 22.7802V11.0565C12.6016 9.92621 13.6696 9.09724 14.7713 9.37245L21.7479 11.1153C22.7179 11.3575 23.398 12.2252 23.398 13.2203V24.944C23.398 26.0743 22.3299 26.9032 21.2283 26.628L14.2516 24.8852Z" fill="white" />
              <path d="M18.8164 26.0288C18.5109 25.951 18.2934 25.6808 18.2827 25.3657L17.9792 16.4124C17.8914 15.2275 17.0118 14.285 16.0926 14.0075C16.041 13.9919 15.9859 14.0129 15.9554 14.0573C15.9243 14.1024 15.9363 14.1649 15.9796 14.1984C16.2066 14.3741 16.8313 14.9475 16.8313 15.9366L16.8295 25.5253L18.8164 26.0288Z" fill="#0077FF" />
              <path d="M25.3828 23.3271C25.0776 23.2507 24.8599 22.9813 24.8492 22.6669L24.5456 13.7142C24.4579 12.5292 23.5782 11.5868 22.659 11.3092C22.6074 11.2937 22.5523 11.3147 22.5218 11.3591C22.4907 11.4042 22.5027 11.4666 22.546 11.5002C22.773 11.6759 23.3978 12.2493 23.3978 13.2383L23.3959 22.8303L25.3828 23.3271Z" fill="#0077FF" />
            </svg>
            <span>Открыть в RuStore</span>
          </a>

          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 py-2 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Вернуться к онлайн-просмотру в браузере</span>
          </a>
        </div>

        {/* Instructions */}
        <div className="pt-4 border-t border-white/10 text-left space-y-2 text-[11px] text-zinc-400">
          <div className="font-semibold text-zinc-300">Инструкция по установке:</div>
          <ol className="list-decimal list-inside space-y-1">
            <li>Откройте скачанный файл <span className="text-zinc-200">OFMEDIA.apk</span> в уведомлениях или «Загрузках».</li>
            <li>При запросе разрешите установку приложений из браузера.</li>
            <li>Нажмите <span className="text-zinc-200">«Установить»</span> и запустите онлайн-кинотеатр.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
