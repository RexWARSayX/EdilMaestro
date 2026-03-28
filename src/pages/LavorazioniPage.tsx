import { useEffect, useState } from 'react';
import { getWorkTypeLabel, materialUnits, workTypes } from '../lib/domain';
import { formatCurrency, formatDate } from '../lib/format';
import type { AppSettings, Project, Lavorazione, Registrazione, WorkType } from '../types';

interface LavorazioniPageProps {
  projects: Project[];
  lavorazioni: Lavorazione[];
  registrazioni: Registrazione[];
  settings: AppSettings;
  onAddLavorazione: (lavorazione: Omit<Lavorazione, 'id'>) => void;
  onUpdateLavorazione: (lavorazioneId: string, lavorazione: Omit<Lavorazione, 'id'>) => void;
  onDeleteLavorazione: (lavorazioneId: string) => void;
}

function createInitialTaskForm(projects: Project[], settings: AppSettings): Omit<Lavorazione, 'id'> {
  return {
    cantiereId: projects[0]?.id ?? '',
    description: '',
    workType: 'economia',
    quantity: 0,
    unit: materialUnits[0],
    amount: 0,
    createdAt: new Date().toISOString()
  };
}

export function LavorazioniPage({
  projects,
  lavorazioni,
  registrazioni,
  settings,
  onAddLavorazione,
  onUpdateLavorazione,
  onDeleteLavorazione
}: LavorazioniPageProps) {
  const [formValue, setFormValue] = useState<Omit<Lavorazione, 'id'>>(createInitialTaskForm(projects, settings));
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setFormValue((currentValue) =>
      workTypes.some((item) => item.value === currentValue.workType)
        ? currentValue
        : { ...currentValue, workType: 'economia' }
    );
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingId) {
      onUpdateLavorazione(editingId, formValue);
    } else {
      onAddLavorazione(formValue);
    }
    setEditingId(null);
    setFormValue(createInitialTaskForm(projects, settings));
  }

  function startEdit(lavorazione: Lavorazione) {
    setEditingId(lavorazione.id);
    setFormValue({
      cantiereId: lavorazione.cantiereId,
      description: lavorazione.description,
      workType: lavorazione.workType,
      quantity: lavorazione.quantity,
      unit: lavorazione.unit,
      amount: lavorazione.amount,
      createdAt: lavorazione.createdAt
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setFormValue(createInitialTaskForm(projects, settings));
  }

  function handleDelete(lavorazione: Lavorazione) {
    const shouldDelete = window.confirm(
      `Eliminare la lavorazione "${lavorazione.description}"? Verranno rimosse anche le registrazioni collegate.`
    );

    if (!shouldDelete) {
      return;
    }

    if (editingId === lavorazione.id) {
      cancelEdit();
    }

    onDeleteLavorazione(lavorazione.id);
  }

  return (
    <div className="page-grid wide-grid">
      <section className="panel form-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{editingId ? 'Modifica lavorazione' : 'Programmazione'}</p>
            <h2>{editingId ? 'Aggiorna la lavorazione selezionata' : 'Nuova lavorazione'}</h2>
          </div>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            <span>Cantiere</span>
            <select
              value={formValue.cantiereId}
              onChange={(event) => setFormValue({ ...formValue, cantiereId: event.target.value })}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Descrizione</span>
            <input
              required
              value={formValue.description}
              onChange={(event) => setFormValue({ ...formValue, description: event.target.value })}
            />
          </label>
          <label>
            <span>Tipologia</span>
            <select
              value={formValue.workType}
              onChange={(event) => setFormValue({ ...formValue, workType: event.target.value as WorkType })}
            >
              {workTypes.map((workType) => (
                <option key={workType.value} value={workType.value}>
                  {workType.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Quantita</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formValue.quantity}
              onChange={(event) => setFormValue({ ...formValue, quantity: Number(event.target.value) })}
            />
          </label>
          <label>
            <span>Unita</span>
            <select
              value={formValue.unit}
              onChange={(event) => setFormValue({ ...formValue, unit: event.target.value })}
            >
              {materialUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </label>
          <label className="full-span">
            <span>Importo preventivato</span>
            <input
              type="number"
              min="0"
              required
              step="0.01"
              value={formValue.amount}
              onChange={(event) =>
                setFormValue({ ...formValue, amount: Number(event.target.value) })
              }
            />
          </label>
          <button type="submit" className="primary-button full-span">
            {editingId ? 'Aggiorna lavorazione' : 'Aggiungi lavorazione'}
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
            <p className="eyebrow">Operativita</p>
            <h2>Agenda lavori</h2>
          </div>
        </div>

        <div className="stack-list">
          {lavorazioni.map((lavorazione) => {
            const project = projects.find((item) => item.id === lavorazione.cantiereId);
            const totalCost = registrazioni
              .filter((registrazione) => registrazione.lavorazioneId === lavorazione.id)
              .reduce((total, registrazione) => total + registrazione.costAmount, 0);

            return (
              <article className="list-card strong-card" key={lavorazione.id}>
                <div>
                  <strong>{lavorazione.description}</strong>
                  <p>
                    {project?.name ?? 'Cantiere non trovato'} · {getWorkTypeLabel(lavorazione.workType)}
                  </p>
                </div>
                <div className="list-meta">
                  <span>{lavorazione.quantity} {lavorazione.unit}</span>
                  <span>{formatCurrency(lavorazione.amount)}</span>
                  <span>Costi registrati {formatCurrency(totalCost)}</span>
                  <span>{formatDate(lavorazione.createdAt)}</span>
                </div>
                <div className="card-actions">
                  <button type="button" className="secondary-button" onClick={() => startEdit(lavorazione)}>
                    Modifica
                  </button>
                  <button type="button" className="danger-button" onClick={() => handleDelete(lavorazione)}>
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
