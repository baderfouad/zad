import { useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { About } from './pages/About';
import { DataPage } from './pages/DataPage';
import { Kitchen } from './pages/Kitchen';
import { Owner } from './pages/Owner';
import { useApp } from './state/AppState';
import { useRoute } from './state/useRoute';

export default function App() {
  const route = useRoute();
  const { data, error, t } = useApp();
  const first = useRef(true);

  // On navigation, start at the top and move focus to the page so screen readers announce it.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    window.scrollTo(0, 0);
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [route]);

  let page;
  if (!data) page = <div className="wrap state" role="status">{error ? t.loadError : t.loading}</div>;
  else if (route === 'owner') page = <Owner />;
  else if (route === 'kitchen') page = <Kitchen />;
  else if (route === 'data') page = <DataPage />;
  else page = <About />;

  return <Layout route={route}>{page}</Layout>;
}
