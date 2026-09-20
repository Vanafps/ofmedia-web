import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Prevent rubber-band elastic overscroll and pull-to-refresh on mobile devices
if (typeof window !== 'undefined') {
  let touchStartY = 0;

  window.addEventListener(
    'touchstart',
    (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartY = e.touches[0].clientY;
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'touchmove',
    (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touchY = e.touches[0].clientY;
      const deltaY = touchY - touchStartY;
      const scrollTop =
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const maxScrollTop = Math.max(0, scrollHeight - clientHeight);

      // Prevent elastic overscroll when pulling down at top
      if (scrollTop <= 0 && deltaY > 0) {
        if (e.cancelable) e.preventDefault();
      }

      // Prevent elastic overscroll when pulling up at bottom
      if (scrollTop >= maxScrollTop && deltaY < 0) {
        if (e.cancelable) e.preventDefault();
      }
    },
    { passive: false }
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
