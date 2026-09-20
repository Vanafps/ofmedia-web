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
    <div className="min-h-screen bg-[#070709] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Ambient background glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#ff5c00]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#ff5c00]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full bg-[#0e0e14]/90 backdrop-blur-3xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
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
            <span>82.5 МБ</span>
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
            href="/"
            className="block py-2 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            ← Вернуться к онлайн-просмотру в браузере
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
