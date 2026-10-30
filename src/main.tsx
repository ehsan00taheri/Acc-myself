/// <reference types="vite/client" />
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Manage Service Worker registration:
// Prevent service worker interception inside development iframes (AI Studio preview)
// while enabling it when running standalone or in a dedicated tab.
if ('serviceWorker' in navigator) {
  const isInIframe = window.self !== window.top;
  if (isInIframe) {
    // Unregister inside iframes so preview never gets hijacked by stale caches
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister();
      }
    }).catch(() => {});
  } else {
    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.BASE_URL}sw.js`;
      navigator.serviceWorker.register(swUrl).catch((err) => {
        console.log('SW registration note:', err);
      });
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);


