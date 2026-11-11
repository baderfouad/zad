import type { ReactNode } from 'react';
import { useApp } from '../state/AppState';
import { href, type Route } from '../state/useRoute';
import { Logo, Moon, Sun } from './Icons';

export function Layout({ route, children }: { route: Route; children: ReactNode }) {
  const { t, lang, setLang, theme, toggleTheme, data, venueId, setVenueId } = useApp();
  const routes: Route[] = ['about', 'owner', 'kitchen', 'data'];
  return (
    <>
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>{t.skip}</a>
      <header className="top">
        <div className="wrap bar">
          <a className="logo" href={href('about')}>
            <Logo />
            <span>{t.logo}</span>
          </a>
          <nav className="views" aria-label={t.navLabel}>
            {routes.map((r) => (
              <a key={r} href={href(r)} aria-current={route === r ? 'page' : undefined}>{t.nav[r]}</a>
            ))}
          </nav>
          <div className="controls">
            {data && data.venues.length > 0 && (
              <label className="venue">
                <span className="sr">{t.venueLabel}</span>
                <select value={venueId} onChange={(e) => setVenueId(e.target.value)}>
                  {data.venues.map((v) => (
                    <option key={v.id} value={v.id}>{lang === 'ar' ? v.nameAr : v.nameEn}</option>
                  ))}
                </select>
              </label>
            )}
            <button type="button" className="iconbtn" onClick={toggleTheme} aria-label={theme === 'dark' ? t.theme.toLight : t.theme.toDark} title={theme === 'dark' ? t.theme.toLight : t.theme.toDark}>
              {theme === 'dark' ? <Sun /> : <Moon />}
            </button>
            <button type="button" className="langbtn" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} lang={lang === 'ar' ? 'en' : 'ar'} aria-label={t.langSwitchLabel}>
              <span className="long">{t.langSwitch}</span>
              <span className="short" aria-hidden="true">{t.langShort}</span>
            </button>
          </div>
        </div>
        <div className="sadu" aria-hidden="true" />
      </header>
      <main id="main" tabIndex={-1}>{children}</main>
      <footer>
        <div className="sadu" aria-hidden="true" />
        <div className="wrap foot">
          <p className="motto">{t.motto}</p>
          <p>{t.foot}</p>
        </div>
      </footer>
    </>
  );
}

/** Small "sample data" note required on Owner and Kitchen pages. */
export function DemoFlag() {
  const { t, data } = useApp();
  const n = data?.warnings.length ?? 0;
  return (
    <p className="demo-flag">
      {t.demo}
      {n > 0 && <> · <a href={href('data')}>{t.dataWarn.replace('{n}', String(n))}</a></>}
    </p>
  );
}
