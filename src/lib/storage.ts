import { defaultData } from '../data/defaultData';
import type { AppData, CostType, CantiereStatus, Project, WorkType } from '../types';

const STORAGE_KEY = 'edilmaestro-data';

function normalizeStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const filtered = value.filter((item): item is string => typeof item === 'string');
  return filtered.length > 0 ? filtered : fallback;
}

function normalizeDateString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function normalizeStatus(value: string | undefined): CantiereStatus {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  return 'attivo';
}

function normalizeWorkType(value: string | undefined): WorkType {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  return 'economia';
}

function normalizeCostType(value: string | undefined): CostType {
  if (typeof value === 'string' && value.trim()) {
    switch (value) {
      case 'Manodopera':
        return 'operai';
      case 'Materiali':
        return 'materiali';
      case 'Noleggi':
        return 'mezzi';
      case 'Trasporti':
        return 'attrezzature';
      default:
        return value;
    }
  }

  return 'spese_varie';
}

function migrateLegacyData(parsedValue: Record<string, unknown>): AppData {
  const projects = Array.isArray(parsedValue.projects) ? parsedValue.projects : [];
  const tasks = Array.isArray(parsedValue.tasks) ? parsedValue.tasks : [];
  const expenses = Array.isArray(parsedValue.expenses) ? parsedValue.expenses : [];

  return {
    settings: defaultData.settings,
    projects: projects.map((project) => {
      const legacyProject = project as Record<string, unknown>;

      return {
        id: String(legacyProject.id ?? legacyProject.projectId ?? Date.now()),
        name: String(legacyProject.name ?? 'Cantiere senza nome'),
        address: String(legacyProject.location ?? ''),
        client: String(legacyProject.client ?? ''),
        manager: String(legacyProject.notes ?? ''),
        status: normalizeStatus(String(legacyProject.status ?? 'attivo')),
        startDate: String(legacyProject.startDate ?? legacyProject.createdAt ?? new Date().toISOString().slice(0, 10)),
        endDate: String(legacyProject.endDate ?? '')
      };
    }),
    lavorazioni: tasks.map((task) => {
      const legacyTask = task as Record<string, unknown>;

      return {
        id: String(legacyTask.id ?? Date.now()),
        cantiereId: String(legacyTask.projectId ?? ''),
        description: String(legacyTask.title ?? 'Lavorazione'),
        workType: normalizeWorkType('economia'),
        quantity: 1,
        unit: String(legacyTask.phase ?? ''),
        amount: Number(legacyTask.costEstimate ?? 0),
        createdAt: String(legacyTask.scheduledDate ?? new Date().toISOString())
      };
    }),
    registrazioni: expenses.map((expense) => {
      const legacyExpense = expense as Record<string, unknown>;
      const amount = Number(legacyExpense.amount ?? 0);

      return {
        id: String(legacyExpense.id ?? Date.now()),
        date: String(legacyExpense.date ?? new Date().toISOString().slice(0, 10)),
        cantiereId: String(legacyExpense.projectId ?? ''),
        lavorazioneId: '',
        costType: normalizeCostType(String(legacyExpense.category ?? 'spese_varie')),
        workerName: '',
        costDescription: String(legacyExpense.description ?? ''),
        costUnit: 'IMPORTO',
        costQuantity: amount ? 1 : 0,
        costUnitPrice: amount,
        costAmount: amount,
        notes: '',
        createdAt: String(legacyExpense.date ?? new Date().toISOString())
      };
    })
  };
}

function isCurrentAppData(value: unknown): value is AppData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    Array.isArray(candidate.projects) &&
    Array.isArray(candidate.lavorazioni) &&
    Array.isArray(candidate.registrazioni) &&
    typeof candidate.settings === 'object' &&
    candidate.settings !== null
  );
}

function hydrateAppData(parsedValue: AppData): AppData {
  return {
    ...parsedValue,
    projects: parsedValue.projects.map((project) => {
      const legacyProject = project as Project & { createdAt?: string };

      return {
        ...project,
        startDate: normalizeDateString(legacyProject.startDate ?? legacyProject.createdAt, new Date().toISOString().slice(0, 10)),
        endDate: normalizeDateString(legacyProject.endDate, '')
      };
    }),
    settings: {
      ...defaultData.settings,
      ...parsedValue.settings,
      ownerName:
        typeof parsedValue.settings.ownerName === 'string'
          ? parsedValue.settings.ownerName
          : defaultData.settings.ownerName,
      personnelOptions: normalizeStringArray(parsedValue.settings.personnelOptions, defaultData.settings.personnelOptions),
      lavorazioniOptions: normalizeStringArray(
        parsedValue.settings.lavorazioniOptions,
        defaultData.settings.lavorazioniOptions
      ),
      costTypeOptions: normalizeStringArray(parsedValue.settings.costTypeOptions, defaultData.settings.costTypeOptions)
    }
  };
}

function restoreAppData(value: unknown): AppData | null {
  if (isCurrentAppData(value)) {
    return hydrateAppData(value);
  }

  if (typeof value === 'object' && value !== null && 'data' in value) {
    const backupData = (value as { data: unknown }).data;

    if (isCurrentAppData(backupData)) {
      return hydrateAppData(backupData);
    }
  }

  if (typeof value === 'object' && value !== null) {
    const parsedValue = value as Record<string, unknown>;

    if (Array.isArray(parsedValue.projects) || Array.isArray(parsedValue.tasks) || Array.isArray(parsedValue.expenses)) {
      return migrateLegacyData(parsedValue);
    }
  }

  return null;
}

export function loadAppData(): AppData {
  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return defaultData;
  }

  try {
    const restoredData = restoreAppData(JSON.parse(rawValue));
    return restoredData ?? defaultData;
  } catch {
    return defaultData;
  }
}

export function saveAppData(data: AppData): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function createBackupFileContent(data: AppData): string {
  return JSON.stringify(
    {
      app: 'EdilMaestro',
      version: 1,
      exportedAt: new Date().toISOString(),
      data
    },
    null,
    2
  );
}

export function parseBackupFileContent(rawContent: string): AppData {
  const parsedValue = JSON.parse(rawContent);
  const restoredData = restoreAppData(parsedValue);

  if (!restoredData) {
    throw new Error('Il file selezionato non contiene un backup valido di EdilMaestro.');
  }

  return restoredData;
}