export type CantiereStatus = string;
export type WorkType = string;
export type CostType = string;

export interface AppSettings {
  appTitle: string;
  companyName: string;
  ownerName: string;
  personnelOptions: string[];
  lavorazioniOptions: string[];
  costTypeOptions: string[];
}

export interface Project {
  id: string;
  name: string;
  address: string;
  client: string;
  manager: string;
  status: CantiereStatus;
  startDate: string;
  endDate: string;
}

export interface Lavorazione {
  id: string;
  cantiereId: string;
  description: string;
  workType: WorkType;
  quantity: number;
  unit: string;
  amount: number;
  createdAt: string;
}

export interface Registrazione {
  id: string;
  date: string;
  cantiereId: string;
  lavorazioneId: string;
  costType: CostType;
  workerName: string;
  costDescription: string;
  costUnit: string;
  costQuantity: number;
  costUnitPrice: number;
  costAmount: number;
  notes: string;
  createdAt: string;
}

export interface AppData {
  settings: AppSettings;
  projects: Project[];
  lavorazioni: Lavorazione[];
  registrazioni: Registrazione[];
}

export interface DashboardStats {
  activeProjects: number;
  totalLavorazioni: number;
  totalRegistrazioni: number;
  totalTodayCosts: number;
  totalCosts: number;
  costsByWorkType: Record<string, number>;
}

export type SettingsSectionKey =
  | 'personnelOptions'
  | 'lavorazioniOptions'
  | 'costTypeOptions';
