import { useEffect, useMemo, useState } from 'react';
import { getCostTypeLabel, getUnitOptions, workers } from '../lib/domain';
import { formatCurrency, formatDate, todayIsoDate } from '../lib/format';
import type { AppSettings, CostType, Lavorazione, Project, Registrazione } from '../types';

interface CostiPageProps {
  projects: Project[];
  lavorazioni: Lavorazione[];
  registrazioni: Registrazione[];
  settings: AppSettings;
  onAddRegistrazione: (registrazione: Omit<Registrazione, 'id'>) => void;
  onUpdateRegistrazione: (registrazioneId: string, registrazione: Omit<Registrazione, 'id'>) => void;
  onDeleteRegistrazione: (registrazioneId: string) => void;
}

function createInitialExpenseForm(
  projects: Project[],
  lavorazioni: Lavorazione[],
  settings: AppSettings
): Omit<Registrazione, 'id'> {
  const cantiereId = projects[0]?.id ?? '';
  const lavorazioneId = settings.lavorazioniOptions[0] ?? '';
  const costType = settings.costTypeOptions[0] ?? 'operai';
  const personnel = settings.personnelOptions[0] ?? workers[0];

  return {
    date: todayIsoDate(),
    cantiereId,
    lavorazioneId,
    costType,
    workerName: personnel,
    costDescription: '',
    costUnit: getUnitOptions(costType)[0] ?? '',
    costQuantity: 0,
    costUnitPrice: 0,
    costAmount: 0,
    notes: '',
    createdAt: new Date().toISOString()
  };
}

export function CostiPage({
  projects,
  lavorazioni,
  registrazioni,
  settings,
  onAddRegistrazione,
  onUpdateRegistrazione,
  onDeleteRegistrazione
}: CostiPageProps) {
  const [formValue, setFormValue] = useState<Omit<Registrazione, 'id'>>(
    createInitialExpenseForm(projects, lavorazioni, settings)
  );
  const [editingId, setEditingId] = useState<string | null>(null);

  const lavorazioniDisponibili = useMemo(() => settings.lavorazioniOptions, [settings.lavorazioniOptions]);

  const unitOptions = useMemo(() => getUnitOptions(formValue.costType), [formValue.costType]);

  useEffect(() => {
    setFormValue((currentValue) => {
      const nextUnitOptions = getUnitOptions(currentValue.costType);
      const nextCostType = settings.costTypeOptions.includes(currentValue.costType)
        ? currentValue.costType
        : settings.costTypeOptions[0] ?? 'operai';
      const nextWorker = settings.personnelOptions.includes(currentValue.workerName)
        ? currentValue.workerName
        : settings.personnelOptions[0] ?? '';
      const nextLavorazione = settings.lavorazioniOptions.includes(currentValue.lavorazioneId)
        ? currentValue.lavorazioneId
        : settings.lavorazioniOptions[0] ?? '';

      return {
        ...currentValue,
        lavorazioneId: nextLavorazione,
        costType: nextCostType,
        workerName: nextCostType.toLowerCase() === 'operai' ? nextWorker : currentValue.workerName,
        costUnit: nextUnitOptions.includes(currentValue.costUnit)
          ? currentValue.costUnit
          : getUnitOptions(nextCostType)[0] ?? ''
      };
    });
  }, [settings.costTypeOptions, settings.personnelOptions, settings.lavorazioniOptions]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      ...formValue,
      costAmount: Number((formValue.costQuantity * formValue.costUnitPrice).toFixed(2))
    };
    if (editingId) {
      onUpdateRegistrazione(editingId, payload);
    } else {
      onAddRegistrazione(payload);
    }
    setEditingId(null);
    setFormValue(createInitialExpenseForm(projects, lavorazioni, settings));
  }

  function startEdit(registrazione: Registrazione) {
    setEditingId(registrazione.id);
    setFormValue({
      date: registrazione.date,
      cantiereId: registrazione.cantiereId,
      lavorazioneId: registrazione.lavorazioneId,
      costType: registrazione.costType,
      workerName: registrazione.workerName,
      costDescription: registrazione.costDescription,
      costUnit: registrazione.costUnit,
      costQuantity: registrazione.costQuantity,
      costUnitPrice: registrazione.costUnitPrice,
      costAmount: registrazione.costAmount,
      notes: registrazione.notes,
      createdAt: registrazione.createdAt
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setFormValue(createInitialExpenseForm(projects, lavorazioni, settings));
  }

  function handleDelete(registrazione: Registrazione) {
    const shouldDelete = window.confirm(
      `Eliminare la registrazione "${registrazione.costDescription || registrazione.date}"?`
    );

    if (!shouldDelete) {
      return;
    }

    if (editingId === registrazione.id) {
      cancelEdit();
    }

    onDeleteRegistrazione(registrazione.id);
  }

  function updateCostType(costType: CostType) {
    setFormValue((currentValue) => ({
      ...currentValue,
      costType,
      workerName:
        costType.toLowerCase() === 'operai'
          ? currentValue.workerName || settings.personnelOptions[0] || workers[0]
          : '',
      costUnit: getUnitOptions(costType)[0] ?? ''
    }));
  }

  function updateCantiere(cantiereId: string) {
    setFormValue((currentValue) => ({
      ...currentValue,
      cantiereId
    }));
  }

  return (
    <div className="page-grid wide-grid">
      <section className="panel form-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{editingId ? 'Modifica registrazione' : 'Nuova registrazione'}</p>
            <h2>{editingId ? 'Aggiorna la registrazione selezionata' : 'Registra costi giornalieri'}</h2>
          </div>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            <span>Data</span>
            <input
              type="date"
              required
              value={formValue.date}
              onChange={(event) => setFormValue({ ...formValue, date: event.target.value })}
            />
          </label>
          <label>
            <span>Cantiere</span>
            <select
              value={formValue.cantiereId}
              onChange={(event) => updateCantiere(event.target.value)}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Lavorazione</span>
            <select
              value={formValue.lavorazioneId}
              onChange={(event) => setFormValue({ ...formValue, lavorazioneId: event.target.value })}
            >
              {lavorazioniDisponibili.map((lavorazione) => (
                <option key={lavorazione} value={lavorazione}>
                  {lavorazione}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Tipologia costo</span>
            <select value={formValue.costType} onChange={(event) => updateCostType(event.target.value as CostType)}>
              {settings.costTypeOptions.map((costType) => (
                <option key={costType} value={costType}>
                  {getCostTypeLabel(costType)}
                </option>
              ))}
            </select>
          </label>
          <label className="full-span">
            <span>Descrizione</span>
            <input
              required
              value={formValue.costDescription}
              onChange={(event) => setFormValue({ ...formValue, costDescription: event.target.value })}
            />
          </label>
          {formValue.costType.toLowerCase() === 'operai' ? (
            <label>
              <span>Operaio</span>
              <select
                value={formValue.workerName}
                onChange={(event) => setFormValue({ ...formValue, workerName: event.target.value })}
              >
                {settings.personnelOptions.map((worker) => (
                  <option key={worker} value={worker}>
                    {worker}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {unitOptions.length > 0 ? (
            <label>
              <span>Unita di misura</span>
              <select
                value={formValue.costUnit}
                onChange={(event) => setFormValue({ ...formValue, costUnit: event.target.value })}
              >
                {unitOptions.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label>
            <span>Quantita</span>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={formValue.costQuantity}
              onChange={(event) => setFormValue({ ...formValue, costQuantity: Number(event.target.value) })}
            />
          </label>
          <label>
            <span>Costo unitario</span>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={formValue.costUnitPrice}
              onChange={(event) => setFormValue({ ...formValue, costUnitPrice: Number(event.target.value) })}
            />
          </label>
          <label className="full-span">
            <span>Totale</span>
            <input readOnly value={Number(formValue.costQuantity * formValue.costUnitPrice).toFixed(2)} />
          </label>
          <label className="full-span">
            <span>Note</span>
            <textarea
              rows={3}
              value={formValue.notes}
              onChange={(event) => setFormValue({ ...formValue, notes: event.target.value })}
            />
          </label>
          <button type="submit" className="primary-button full-span">
            {editingId ? 'Aggiorna registrazione' : 'Registra costo'}
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
            <p className="eyebrow">Storico</p>
            <h2>Ultime registrazioni</h2>
          </div>
        </div>

        <div className="stack-list">
          {registrazioni.map((registrazione) => {
            const project = projects.find((item) => item.id === registrazione.cantiereId);

            return (
              <article className="list-card strong-card" key={registrazione.id}>
                <div>
                  <strong>{registrazione.costDescription || 'Registrazione costo'}</strong>
                  <p>
                    {project?.name ?? 'Cantiere non trovato'} · {registrazione.lavorazioneId || 'Lavorazione non definita'}
                  </p>
                </div>
                <div className="list-meta emphasis">
                  <span>{getCostTypeLabel(registrazione.costType)}</span>
                  <span>{formatCurrency(registrazione.costAmount)}</span>
                  <span>{formatDate(registrazione.date)}</span>
                  {registrazione.workerName ? <span>{registrazione.workerName}</span> : null}
                </div>
                <div className="card-actions">
                  <button type="button" className="secondary-button" onClick={() => startEdit(registrazione)}>
                    Modifica
                  </button>
                  <button type="button" className="danger-button" onClick={() => handleDelete(registrazione)}>
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
