import { useEffect, useState } from 'react';
import { cantiereStatuses, getStatusLabel } from '../lib/domain';
import { formatCurrency, formatDate, todayIsoDate } from '../lib/format';
import type { AppSettings, Project, Registrazione, Lavorazione, CantiereStatus } from '../types';

interface CantieriPageProps {
  projects: Project[];
  lavorazioni: Lavorazione[];
  registrazioni: Registrazione[];
  settings: AppSettings;
  onAddProject: (project: Omit<Project, 'id'>) => void;
  onUpdateProject: (projectId: string, project: Omit<Project, 'id'>) => void;
  onDeleteProject: (projectId: string) => void;
}

const initialProjectForm: Omit<Project, 'id'> = {
  name: '',
  address: '',
  client: '',
  manager: '',
  status: 'attivo',
  startDate: todayIsoDate(),
  endDate: ''
};

export function CantieriPage({
  projects,
  lavorazioni,
  registrazioni,
  settings,
  onAddProject,
  onUpdateProject,
  onDeleteProject
}: CantieriPageProps) {
  const [formValue, setFormValue] = useState<Omit<Project, 'id'>>(initialProjectForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingId) {
      onUpdateProject(editingId, formValue);
    } else {
      onAddProject(formValue);
    }
    setEditingId(null);
    setFormValue(initialProjectForm);
  }

  function startEdit(project: Project) {
    setEditingId(project.id);
    setFormValue({
      name: project.name,
      address: project.address,
      client: project.client,
      manager: project.manager,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setFormValue(initialProjectForm);
  }

  function handleDelete(project: Project) {
    const shouldDelete = window.confirm(
      `Eliminare il cantiere "${project.name}"? Verranno rimosse anche lavorazioni e registrazioni collegate.`
    );

    if (!shouldDelete) {
      return;
    }

    if (editingId === project.id) {
      cancelEdit();
    }

    onDeleteProject(project.id);
  }

  return (
    <div className="page-grid wide-grid">
      <section className="panel form-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{editingId ? 'Modifica cantiere' : 'Nuovo cantiere'}</p>
            <h2>{editingId ? 'Aggiorna la commessa selezionata' : 'Inserisci una nuova commessa'}</h2>
          </div>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            <span>Nome cantiere</span>
            <input
              required
              value={formValue.name}
              onChange={(event) => setFormValue({ ...formValue, name: event.target.value })}
            />
          </label>
          <label>
            <span>Indirizzo</span>
            <input
              value={formValue.address}
              onChange={(event) => setFormValue({ ...formValue, address: event.target.value })}
            />
          </label>
          <label>
            <span>Committente</span>
            <input
              value={formValue.client}
              onChange={(event) => setFormValue({ ...formValue, client: event.target.value })}
            />
          </label>
          <label>
            <span>Responsabile</span>
            <input
              value={formValue.manager}
              onChange={(event) => setFormValue({ ...formValue, manager: event.target.value })}
            />
          </label>
          <label className="full-span">
            <span>Stato</span>
            <select
              value={formValue.status}
              onChange={(event) =>
                setFormValue({
                  ...formValue,
                  status: event.target.value as CantiereStatus,
                  endDate: event.target.value === 'completato' ? formValue.endDate : ''
                })
              }
            >
              {cantiereStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Data inizio</span>
            <input
              type="date"
              required
              value={formValue.startDate}
              onChange={(event) => setFormValue({ ...formValue, startDate: event.target.value })}
            />
          </label>
          <label>
            <span>Data fine</span>
            <input
              type="date"
              value={formValue.endDate}
              disabled={formValue.status !== 'completato'}
              onChange={(event) => setFormValue({ ...formValue, endDate: event.target.value })}
            />
          </label>
          <button type="submit" className="primary-button full-span">
            {editingId ? 'Aggiorna cantiere' : 'Salva cantiere'}
          </button>
          {editingId ? (
            <button type="button" className="secondary-button full-span" onClick={cancelEdit}>
              Annulla modifica
            </button>
          ) : null}
        </form>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Registro cantieri</p>
            <h2>Panoramica commesse</h2>
          </div>
        </div>

        <div className="stack-list">
          {projects.map((project) => {
            const totalCost = registrazioni
              .filter((registrazione) => registrazione.cantiereId === project.id)
              .reduce((total, registrazione) => total + registrazione.costAmount, 0);
            const totalLavorazioni = lavorazioni.filter((lavorazione) => lavorazione.cantiereId === project.id).length;

            return (
              <article className="project-card" key={project.id}>
                <div className="project-header">
                  <div>
                    <h3>{project.name}</h3>
                    <p>
                      {project.client || 'Committente non definito'} · {project.address || 'Indirizzo non definito'}
                    </p>
                  </div>
                  <span className="status-pill">{getStatusLabel(project.status)}</span>
                </div>

                <div className="details-grid">
                  <div>
                    <span>Responsabile</span>
                    <strong>{project.manager || 'N/D'}</strong>
                  </div>
                  <div>
                    <span>Data inizio</span>
                    <strong>{formatDate(project.startDate)}</strong>
                  </div>
                  <div>
                    <span>Data fine</span>
                    <strong>{project.status === 'completato' && project.endDate ? formatDate(project.endDate) : 'Non definita'}</strong>
                  </div>
                  <div>
                    <span>Lavorazioni</span>
                    <strong>{totalLavorazioni}</strong>
                  </div>
                  <div>
                    <span>Costi registrati</span>
                    <strong>{formatCurrency(totalCost)}</strong>
                  </div>
                </div>

                <div className="card-actions">
                  <button type="button" className="secondary-button" onClick={() => startEdit(project)}>
                    Modifica
                  </button>
                  <button type="button" className="danger-button" onClick={() => handleDelete(project)}>
                    Elimina
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
