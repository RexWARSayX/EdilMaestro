import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import {
  downloadGithubBackup,
  listGithubBackups,
  loadGithubBackupToken,
  saveGithubBackupToken,
  uploadGithubBackup
} from './lib/githubBackup';
import { createBackupFileContent, loadAppData, parseBackupFileContent, saveAppData } from './lib/storage';
import { CantieriPage } from './pages/CantieriPage';
import { CostiPage } from './pages/CostiPage';
import { DashboardPage } from './pages/DashboardPage';
import { LavorazioniPage } from './pages/LavorazioniPage';
import { SettingsPage } from './pages/SettingsPage';
import { ReportPage } from './pages/ReportPage';
import type { AppData, GithubBackupEntry, Lavorazione, Project, Registrazione, SettingsSectionKey } from './types';

function createSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function createId(prefix: string, value: string): string {
  return `${prefix}-${createSlug(value)}-${Date.now()}`;
}

export default function App() {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [githubToken, setGithubToken] = useState(() => loadGithubBackupToken());
  const [githubBackups, setGithubBackups] = useState<GithubBackupEntry[]>([]);
  const [isGithubBackupBusy, setIsGithubBackupBusy] = useState(false);

  useEffect(() => {
    saveAppData(data);
  }, [data]);

  useEffect(() => {
    saveGithubBackupToken(githubToken);
  }, [githubToken]);

  useEffect(() => {
    void refreshGithubBackups().catch(() => {
      setGithubBackups([]);
    });
  }, [githubToken]);

  const today = new Date().toISOString().slice(0, 10);
  const costsByWorkType: Record<string, number> = Object.fromEntries(
    data.settings.lavorazioniOptions.map((option) => [option, 0])
  );

  data.registrazioni.forEach((registrazione) => {
    if (registrazione.lavorazioneId) {
      costsByWorkType[registrazione.lavorazioneId] =
        (costsByWorkType[registrazione.lavorazioneId] ?? 0) + registrazione.costAmount;
    }
  });

  const stats = {
    activeProjects: data.projects.filter((project) => project.status === 'attivo').length,
    totalLavorazioni: data.lavorazioni.length,
    totalRegistrazioni: data.registrazioni.length,
    totalTodayCosts: data.registrazioni
      .filter((registrazione) => registrazione.date === today)
      .reduce((total, registrazione) => total + registrazione.costAmount, 0),
    totalCosts: data.registrazioni.reduce((total, registrazione) => total + registrazione.costAmount, 0),
    costsByWorkType
  };

  function addProject(project: Omit<Project, 'id'>) {
    setData((currentValue) => ({
      ...currentValue,
      projects: [
        {
          ...project,
          id: createId('project', project.name)
        },
        ...currentValue.projects
      ]
    }));
  }

  function addLavorazione(lavorazione: Omit<Lavorazione, 'id'>) {
    setData((currentValue) => ({
      ...currentValue,
      lavorazioni: [
        {
          ...lavorazione,
          id: createId('lavorazione', lavorazione.description)
        },
        ...currentValue.lavorazioni
      ]
    }));
  }

  function addRegistrazione(registrazione: Omit<Registrazione, 'id'>) {
    setData((currentValue) => ({
      ...currentValue,
      registrazioni: [
        {
          ...registrazione,
          id: createId('registrazione', registrazione.costDescription || registrazione.date)
        },
        ...currentValue.registrazioni
      ]
    }));
  }

  function updateSettingsSection(section: SettingsSectionKey, values: string[]) {
    setData((currentValue) => ({
      ...currentValue,
      settings: {
        ...currentValue.settings,
        [section]: values
      }
    }));
  }

  function updateGeneralSettings(values: { companyName: string; ownerName: string }) {
    setData((currentValue) => ({
      ...currentValue,
      settings: {
        ...currentValue.settings,
        companyName: values.companyName,
        ownerName: values.ownerName
      }
    }));
  }

  async function refreshGithubBackups() {
    const backups = await listGithubBackups(githubToken);
    setGithubBackups(backups);
  }

  async function exportBackup(): Promise<string> {
    setIsGithubBackupBusy(true);

    try {
      const backupContent = createBackupFileContent(data);
      const uploadedBackup = await uploadGithubBackup(backupContent, githubToken);
      await refreshGithubBackups();
      return `Backup salvato su GitHub come ${uploadedBackup.fileName}.`;
    } finally {
      setIsGithubBackupBusy(false);
    }
  }

  async function importBackup(backup: GithubBackupEntry): Promise<string> {
    setIsGithubBackupBusy(true);

    try {
      const importedData = parseBackupFileContent(await downloadGithubBackup(backup, githubToken));
      setData(importedData);
      return `Backup GitHub ${backup.name} caricato correttamente.`;
    } finally {
      setIsGithubBackupBusy(false);
    }
  }

  return (
    <Layout stats={stats} settings={data.settings}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <DashboardPage
              projects={data.projects}
              lavorazioni={data.lavorazioni}
              registrazioni={data.registrazioni}
              stats={stats}
            />
          }
        />
        <Route
          path="/cantieri"
          element={
            <CantieriPage
              projects={data.projects}
              lavorazioni={data.lavorazioni}
              registrazioni={data.registrazioni}
              settings={data.settings}
              onAddProject={addProject}
              onUpdateProject={(projectId, project) => {
                setData((currentValue) => ({
                  ...currentValue,
                  projects: currentValue.projects.map((item) =>
                    item.id === projectId ? { ...item, ...project } : item
                  )
                }));
              }}
              onDeleteProject={(projectId) => {
                setData((currentValue) => ({
                  ...currentValue,
                  projects: currentValue.projects.filter((item) => item.id !== projectId),
                  lavorazioni: currentValue.lavorazioni.filter((item) => item.cantiereId !== projectId),
                  registrazioni: currentValue.registrazioni.filter((item) => item.cantiereId !== projectId)
                }));
              }}
            />
          }
        />
        <Route
          path="/lavorazioni"
          element={
            <LavorazioniPage
              projects={data.projects}
              lavorazioni={data.lavorazioni}
              registrazioni={data.registrazioni}
              settings={data.settings}
              onAddLavorazione={addLavorazione}
              onUpdateLavorazione={(lavorazioneId, lavorazione) => {
                setData((currentValue) => ({
                  ...currentValue,
                  lavorazioni: currentValue.lavorazioni.map((item) =>
                    item.id === lavorazioneId ? { ...item, ...lavorazione } : item
                  )
                }));
              }}
              onDeleteLavorazione={(lavorazioneId) => {
                setData((currentValue) => ({
                  ...currentValue,
                  lavorazioni: currentValue.lavorazioni.filter((item) => item.id !== lavorazioneId),
                  registrazioni: currentValue.registrazioni.filter((item) => item.lavorazioneId !== lavorazioneId)
                }));
              }}
            />
          }
        />
        <Route
          path="/registrazioni"
          element={
            <CostiPage
              projects={data.projects}
              lavorazioni={data.lavorazioni}
              registrazioni={data.registrazioni}
              settings={data.settings}
              onAddRegistrazione={addRegistrazione}
              onUpdateRegistrazione={(registrazioneId, registrazione) => {
                setData((currentValue) => ({
                  ...currentValue,
                  registrazioni: currentValue.registrazioni.map((item) =>
                    item.id === registrazioneId ? { ...item, ...registrazione } : item
                  )
                }));
              }}
              onDeleteRegistrazione={(registrazioneId) => {
                setData((currentValue) => ({
                  ...currentValue,
                  registrazioni: currentValue.registrazioni.filter((item) => item.id !== registrazioneId)
                }));
              }}
            />
          }
        />
        <Route path="/costi" element={<Navigate to="/registrazioni" replace />} />
        <Route
          path="/impostazioni"
          element={
            <SettingsPage
              settings={data.settings}
              githubToken={githubToken}
              githubBackups={githubBackups}
              isGithubBackupBusy={isGithubBackupBusy}
              onChangeSection={updateSettingsSection}
              onUpdateGeneral={updateGeneralSettings}
              onGithubTokenChange={setGithubToken}
              onExportBackup={exportBackup}
              onImportBackup={importBackup}
              onRefreshGithubBackups={refreshGithubBackups}
            />
          }
        />
        <Route
          path="/report"
          element={
            <ReportPage
              projects={data.projects}
              lavorazioni={data.lavorazioni}
              registrazioni={data.registrazioni}
              settings={data.settings}
            />
          }
        />
      </Routes>
    </Layout>
  );
}

