import type { CostType, CantiereStatus, WorkType } from '../types';

export const cantiereStatuses: Array<{ value: CantiereStatus; label: string }> = [
  { value: 'attivo', label: 'Attivo' },
  { value: 'sospeso', label: 'Sospeso' },
  { value: 'completato', label: 'Completato' }
];

export const workTypes: Array<{ value: WorkType; label: string }> = [
  { value: 'economia', label: 'In Economia' },
  { value: 'misura', label: 'A Misura' },
  { value: 'corpo', label: 'A Corpo' }
];

export const costTypes: Array<{ value: CostType; label: string }> = [
  { value: 'operai', label: 'Operai' },
  { value: 'materiali', label: 'Materiali' },
  { value: 'mezzi', label: 'Mezzi' },
  { value: 'attrezzature', label: 'Attrezzature' },
  { value: 'subappalti', label: 'Subappalti' },
  { value: 'spese_varie', label: 'Spese Varie' }
];

export const workers = ['Matteo', 'Simone', 'Massimo', 'Alfredo', 'Filippo', 'Altro'];
export const materialUnits = ['SA', 'PZ', 'MQ', 'ML', 'MC', 'KG', 'LT', 'QLI', 'TN', 'CONF'];
export const mezziUnits = ['VIAGGIO', 'ORE', 'GIORNO', 'TRASPORTO', 'KM'];
export const attrezzatureUnits = ['VIAGGIO', 'ORE', 'GIORNO', 'TRASPORTO', 'A CORPO'];
export const subappaltiUnits = [
  'SA',
  'PZ',
  'MQ',
  'ML',
  'MC',
  'KG',
  'LT',
  'QLI',
  'TN',
  'CONF',
  'A CORPO'
];

export function getStatusLabel(value: CantiereStatus): string {
  return cantiereStatuses.find((item) => item.value === value)?.label ?? value;
}

export function getWorkTypeLabel(value: WorkType): string {
  return workTypes.find((item) => item.value === value)?.label ?? value;
}

export function getCostTypeLabel(value: CostType): string {
  return costTypes.find((item) => item.value === value)?.label ?? value;
}

export function getUnitOptions(costType: CostType): string[] {
  switch (costType.toLowerCase()) {
    case 'materiali':
      return materialUnits;
    case 'mezzi':
      return mezziUnits;
    case 'attrezzature':
      return attrezzatureUnits;
    case 'subappalti':
      return subappaltiUnits;
    case 'spese_varie':
      return ['IMPORTO'];
    default:
      return [];
  }
}