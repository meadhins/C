import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Register service worker with auto-update
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    try {
      const url = new URL(window.location.href);
      const basePath = url.pathname.endsWith('/') ? url.pathname : url.pathname + '/';
      const swUrl = url.origin + basePath + 'sw.js';
      navigator.serviceWorker
        .register(swUrl, { scope: basePath })
        .then((reg) => {
          // Check for service worker updates immediately
          reg.update();
        })
        .catch(() => {
          navigator.serviceWorker.register('./sw.js').catch(() => {});
        });
    } catch {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  });

  // Reload page when new service worker takes control so updates appear seamlessly
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

createRoot(document.getElementById('root')).render(<App />);
