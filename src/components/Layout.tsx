import type { ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { formatCurrency } from '../lib/format';
import type { AppSettings, DashboardStats } from '../types';

interface LayoutProps {
  stats: DashboardStats;
  settings: AppSettings;
  children: ReactNode;
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/cantieri', label: 'Cantieri' },
  { to: '/lavorazioni', label: 'Lavorazioni' },
  { to: '/registrazioni', label: 'Registrazioni' },
  { to: '/report', label: 'Report' }
];

const pageTitles: Record<string, string> = {
  '/dashboard': 'Riepilogo generale, costi del giorno e attivita recenti.',
  '/cantieri': 'Anagrafica cantieri con stato, committente e responsabile.',
  '/lavorazioni': 'Elenco lavorazioni per tipologia economia, misura o corpo.',
  '/registrazioni': 'Registrazioni giornaliere costi per operai, materiali, mezzi e subappalti.',
  '/report': 'Sintesi stampabile per cantiere con breakdown economico.',
  '/impostazioni': 'Configurazione opzioni selezionabili per sezioni e pagine operative.'
};

export function Layout({ stats, settings, children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="app-shell">
      <div className="bg-grid" aria-hidden="true" />
      <header className="hero-panel">
        <div className="hero-toolbar">
          <Link to="/impostazioni" className="settings-link">
            Impostazioni
          </Link>
        </div>
        <div>
          <p className="eyebrow">{settings.companyName}</p>
          <h1>{settings.appTitle}</h1>
          <p className="hero-copy">{pageTitles[location.pathname] ?? pageTitles['/dashboard']}</p>
        </div>

        <div className="hero-stats">
          <article className="mini-stat">
            <span>Cantieri attivi</span>
            <strong>{stats.activeProjects}</strong>
          </article>
          <article className="mini-stat">
            <span>Costi oggi</span>
            <strong>{formatCurrency(stats.totalTodayCosts)}</strong>
          </article>
          <article className="mini-stat">
            <span>Costi totali</span>
            <strong>{formatCurrency(stats.totalCosts)}</strong>
          </article>
        </div>
      </header>

      <main className="main-layout">{children}</main>

      <nav className="bottom-nav" aria-label="Navigazione principale">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
