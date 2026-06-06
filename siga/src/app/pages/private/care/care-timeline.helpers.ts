import {
  AnimalCareRecord,
  AnimalCareTimelineState,
  AnimalCareType,
} from '../../../models/animal-health/animal-care-record.model';
import { getDaysUntil } from '../../../utils/utils';

export type CareFilterType = 'all' | AnimalCareType;
export type CareFilterState = 'all' | AnimalCareTimelineState;

export interface CareFilters {
  animalId: string;
  state: CareFilterState;
  type: CareFilterType;
}

const timelinePriority: Record<AnimalCareTimelineState, number> = {
  overdue: 0,
  due_soon: 1,
  scheduled: 2,
  unscheduled: 3,
  completed: 4,
};

export function getAlertDate(record: AnimalCareRecord): string | null {
  if (record.status === 'pending') {
    return record.scheduledDate || record.nextDueDate;
  }

  return record.nextDueDate;
}

export function getTimelineState(record: AnimalCareRecord): AnimalCareTimelineState {
  const alertDate = getAlertDate(record);

  if (!alertDate) {
    return record.status === 'completed' ? 'completed' : 'unscheduled';
  }

  const daysUntil = getDaysUntil(alertDate);

  if (daysUntil < 0) {
    return 'overdue';
  }

  if (daysUntil <= 30) {
    return 'due_soon';
  }

  return 'scheduled';
}

export function getTimelineLabel(record: AnimalCareRecord): string {
  const labels: Record<AnimalCareTimelineState, string> = {
    overdue: 'Em atraso',
    due_soon: 'Próximo',
    scheduled: 'Agendado',
    completed: 'Concluído',
    unscheduled: 'Sem data',
  };

  return labels[getTimelineState(record)];
}

export function getTimelineDescription(record: AnimalCareRecord): string {
  const alertDate = getAlertDate(record);

  if (!alertDate) {
    return record.status === 'completed' ? 'Sem próxima data registada' : 'Ainda sem data prevista';
  }

  const daysUntil = getDaysUntil(alertDate);

  if (daysUntil < 0) {
    return `${Math.abs(daysUntil)} dia(s) em atraso`;
  }

  if (daysUntil === 0) {
    return 'Marcado para hoje';
  }

  return `Faltam ${daysUntil} dia(s)`;
}

export function getCareRecordKey(record: AnimalCareRecord): string {
  return `${record.type}:${record.id}`;
}

export function matchesCareFilters(record: AnimalCareRecord, filters: CareFilters): boolean {
  const matchesType = filters.type === 'all' || record.type === filters.type;
  const matchesAnimal = filters.animalId === 'all' || record.animalId === filters.animalId;
  const matchesState = filters.state === 'all' || getTimelineState(record) === filters.state;

  return matchesType && matchesAnimal && matchesState;
}

export function compareCareRecords(
  firstRecord: AnimalCareRecord,
  secondRecord: AnimalCareRecord,
): number {
  const firstState = getTimelineState(firstRecord);
  const secondState = getTimelineState(secondRecord);
  const stateResult = timelinePriority[firstState] - timelinePriority[secondState];

  if (stateResult !== 0) {
    return stateResult;
  }

  const firstDate = getSortDate(firstRecord);
  const secondDate = getSortDate(secondRecord);

  if (firstDate && secondDate && firstDate !== secondDate) {
    return firstDate.localeCompare(secondDate);
  }

  if (firstDate && !secondDate) {
    return -1;
  }

  if (!firstDate && secondDate) {
    return 1;
  }

  return firstRecord.createdAt.localeCompare(secondRecord.createdAt);
}

function getSortDate(record: AnimalCareRecord): string | null {
  return getAlertDate(record) || record.completedDate || record.createdAt || null;
}
