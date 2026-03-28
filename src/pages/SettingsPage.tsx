import { useEffect, useState } from 'react';
import { getGithubBackupLocation } from '../lib/githubBackup';
import type { AppSettings, GithubBackupEntry, SettingsSectionKey } from '../types';

interface SettingsPageProps {
  settings: AppSettings;
  onChangeSection: (section: SettingsSectionKey, values: string[]) => void;
  onUpdateGeneral: (values: { companyName: string; ownerName: string }) => void;
  githubToken: string;
  githubBackups: GithubBackupEntry[];
  isGithubBackupBusy: boolean;
  onGithubTokenChange: (token: string) => void;
  onExportBackup: () => Promise<string>;
  onImportBackup: (backup: GithubBackupEntry) => Promise<string>;
  onRefreshGithubBackups: () => Promise<void>;
}

const sections: Array<{ key: SettingsSectionKey; title: string; description: string }> = [
  {
    key: 'personnelOptions',
    title: 'Personale',
    description: 'Nomi selezionabili nelle registrazioni operai.'
  },
  {
    key: 'lavorazioniOptions',
    title: 'Lavorazioni',
    description: 'Valori selezionabili nel campo Lavorazione della pagina registrazioni.'
  },
  {
    key: 'costTypeOptions',
    title: 'Tipologia di costo',
    description: 'Tipologie disponibili nella pagina registrazioni.'
  }
];

export function SettingsPage({
  settings,
  onChangeSection,
  onUpdateGeneral,
  githubToken,
  githubBackups,
  isGithubBackupBusy,
  onGithubTokenChange,
  onExportBackup,
  onImportBackup,
  onRefreshGithubBackups
}: SettingsPageProps) {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedBackupPath, setSelectedBackupPath] = useState('');

  useEffect(() => {
    if (githubBackups.length === 0) {
      setSelectedBackupPath('');
      return;
    }

    if (!githubBackups.some((backup) => backup.path === selectedBackupPath)) {
      setSelectedBackupPath(githubBackups[0].path);
    }
  }, [githubBackups, selectedBackupPath]);

  function updateValue(section: SettingsSectionKey, index: number, value: string) {
    const updated = [...settings[section]];
    updated[index] = value;
    onChangeSection(section, updated);
  }

  function addValue(section: SettingsSectionKey) {
    onChangeSection(section, [...settings[section], '']);
  }

  function removeValue(section: SettingsSectionKey, index: number) {
    const currentValues = settings[section];
    const updated = currentValues.filter((_, itemIndex) => itemIndex !== index);
    onChangeSection(section, updated.length > 0 ? updated : ['']);
  }

  async function handleExportBackup() {
    try {
      const message = await onExportBackup();
      setFeedback({ type: 'success', message });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Impossibile salvare il backup su GitHub.'
      });
    }
  }

  async function handleImportBackup() {
    const selectedBackup = githubBackups.find((backup) => backup.path === selectedBackupPath);

    if (!selectedBackup) {
      setFeedback({ type: 'error', message: 'Seleziona un backup GitHub da caricare.' });
      return;
    }

    if (!window.confirm('Caricare il backup sostituira tutti i dati attuali dell\'app. Continuare?')) {
      return;
    }

    try {
      const message = await onImportBackup(selectedBackup);
      setFeedback({ type: 'success', message });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Impossibile caricare il backup GitHub selezionato.'
      });
    }
  }

  async function handleRefreshGithubBackups() {
    try {
      await onRefreshGithubBackups();
      setFeedback({ type: 'success', message: 'Elenco backup GitHub aggiornato.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Impossibile aggiornare l\'elenco backup GitHub.'
      });
    }
  }

  return (
    <div className="page-grid settings-grid">
      <section className="panel settings-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Impostazioni</p>
            <h2>Generale</h2>
            <p className="settings-copy">Dati aziendali riportati in dashboard e report.</p>
          </div>
        </div>

        <div className="settings-list">
          <label>
            <span>Nome azienda</span>
            <input
              value={settings.companyName}
              onChange={(event) =>
                onUpdateGeneral({ companyName: event.target.value, ownerName: settings.ownerName })
              }
            />
          </label>
          <label>
            <span>Nome titolare</span>
            <input
              value={settings.ownerName}
              onChange={(event) =>
                onUpdateGeneral({ companyName: settings.companyName, ownerName: event.target.value })
              }
            />
          </label>
          <label>
            <span>Token GitHub</span>
            <input
              type="password"
              value={githubToken}
              placeholder="github_pat_..."
              autoComplete="off"
              onChange={(event) => onGithubTokenChange(event.target.value)}
            />
          </label>
          <p className="settings-copy">
            Backup GitHub: {getGithubBackupLocation()}. Il token resta solo nel browser corrente e deve avere permesso
            Contents: Read and write sul repository.
          </p>
          <label>
            <span>Backup disponibili</span>
            <select value={selectedBackupPath} onChange={(event) => setSelectedBackupPath(event.target.value)}>
              {githubBackups.length === 0 ? (
                <option value="">Nessun backup trovato nella cartella GitHub</option>
              ) : (
                githubBackups.map((backup) => (
                  <option key={backup.path} value={backup.path}>
                    {backup.name}
                  </option>
                ))
              )}
            </select>
          </label>
          <div className="backup-actions">
            <button
              type="button"
              className="secondary-button backup-button"
              onClick={() => void handleExportBackup()}
              disabled={isGithubBackupBusy}
            >
              Backup
            </button>
            <button
              type="button"
              className="secondary-button backup-button"
              onClick={() => void handleImportBackup()}
              disabled={isGithubBackupBusy || !selectedBackupPath}
            >
              Carica backup
            </button>
            <button
              type="button"
              className="secondary-button backup-button"
              onClick={() => void handleRefreshGithubBackups()}
              disabled={isGithubBackupBusy}
            >
              Aggiorna elenco
            </button>
          </div>
          {feedback ? <p className={`settings-feedback settings-feedback-${feedback.type}`}>{feedback.message}</p> : null}
        </div>
      </section>

      {sections.map((section) => (
        <section className="panel settings-panel" key={section.key}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Impostazioni</p>
              <h2>{section.title}</h2>
              <p className="settings-copy">{section.description}</p>
            </div>
          </div>

          <div className="settings-list">
            {settings[section.key].map((value, index) => (
              <div className="settings-row" key={`${section.key}-${index}`}>
                <input
                  value={value}
                  placeholder="Nuovo valore"
                  onChange={(event) => updateValue(section.key, index, event.target.value)}
                />
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => removeValue(section.key, index)}
                >
                  Elimina
                </button>
              </div>
            ))}
          </div>

          <button type="button" className="primary-button add-setting-button" onClick={() => addValue(section.key)}>
            +
          </button>
        </section>
      ))}
    </div>
  );
}