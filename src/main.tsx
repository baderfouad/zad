import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
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
if (import.meta.env.PROD) registerSW({ immediate: true });
