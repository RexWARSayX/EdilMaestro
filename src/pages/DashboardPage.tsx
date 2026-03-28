import { getCostTypeLabel, getWorkTypeLabel } from '../lib/domain';
import { formatCurrency, formatDate, todayIsoDate } from '../lib/format';
import type { DashboardStats, Lavorazione, Project, Registrazione } from '../types';

interface DashboardPageProps {
  projects: Project[];
  lavorazioni: Lavorazione[];
  registrazioni: Registrazione[];
  stats: DashboardStats;
}

export function DashboardPage({ projects, lavorazioni, registrazioni, stats }: DashboardPageProps) {
  const today = todayIsoDate();
  const todayRegistrazioni = [...registrazioni]
    .filter((registrazione) => registrazione.date === today)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 4);

  const recentLavorazioni = [...lavorazioni]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 4);

  return (
    <div className="page-grid">
      <section className="panel accent-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Quadro generale</p>
            <h2>Numeri essenziali sempre visibili</h2>
          </div>
        </div>

        <div className="stats-grid">
          <article className="stat-card">
            <span>Cantieri attivi</span>
            <strong>{stats.activeProjects}</strong>
          </article>
          <article className="stat-card">
            <span>Lavorazioni</span>
            <strong>{stats.totalLavorazioni}</strong>
          </article>
          <article className="stat-card">
            <span>Registrazioni</span>
            <strong>{stats.totalRegistrazioni}</strong>
          </article>
          <article className="stat-card">
            <span>Costi oggi</span>
            <strong>{formatCurrency(stats.totalTodayCosts)}</strong>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Priorita</p>
            <h2>Registrazioni di oggi</h2>
          </div>
        </div>

        <div className="stack-list">
          {todayRegistrazioni.map((registrazione) => {
            const project = projects.find((item) => item.id === registrazione.cantiereId);
            return (
            <article className="list-card" key={registrazione.id}>
              <div>
                <strong>{project?.name ?? 'Cantiere non trovato'}</strong>
                <p>{registrazione.costDescription || getCostTypeLabel(registrazione.costType)}</p>
              </div>
              <div className="list-meta">
                <span>{getCostTypeLabel(registrazione.costType)}</span>
                <span>{formatCurrency(registrazione.costAmount)}</span>
                <span>{formatDate(registrazione.date)}</span>
              </div>
            </article>
          );})}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Breakdown</p>
            <h2>Costi per tipologia lavorazione</h2>
          </div>
        </div>

        <div className="progress-list">
          {Object.entries(stats.costsByWorkType).map(([workType, amount]) => (
            <article className="progress-card" key={workType}>
              <div className="progress-topline">
                <div>
                  <strong>{workType}</strong>
                  <p>Totale costi registrati</p>
                </div>
                <span>{formatCurrency(amount)}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Nuove voci</p>
            <h2>Lavorazioni inserite di recente</h2>
          </div>
        </div>

        <div className="stack-list">
          {recentLavorazioni.map((lavorazione) => {
            const project = projects.find((item) => item.id === lavorazione.cantiereId);
            return (
            <article className="list-card" key={lavorazione.id}>
              <div>
                <strong>{lavorazione.description}</strong>
                <p>{project?.name ?? 'Cantiere non trovato'}</p>
              </div>
              <div className="list-meta emphasis">
                <span>{getWorkTypeLabel(lavorazione.workType)}</span>
                <span>{lavorazione.quantity} {lavorazione.unit}</span>
                <span>{formatCurrency(lavorazione.amount)}</span>
              </div>
            </article>
          );})}
        </div>
      </section>
    </div>
  );
}
