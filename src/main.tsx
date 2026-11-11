import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { FILES } from './data/types';
import { AppProvider } from './state/AppState';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);

// Service worker: caches the app and data so it keeps working if the venue Wi-Fi drops.
// Once it controls the page, fetch the data again through it so the CSVs are cached for offline use from the first visit.
if (import.meta.env.PROD) {
  registerSW({ immediate: true });
  void warmDataCache();
}
async function warmDataCache() {
  const sw = navigator.serviceWorker;
  if (!sw) return;
  await sw.ready;
  if (!sw.controller) await new Promise((r) => sw.addEventListener('controllerchange', r, { once: true }));
  for (const f of FILES) void fetch(`${import.meta.env.BASE_URL}data/${f}.csv`, { cache: 'no-cache' }).catch(() => {});
}
