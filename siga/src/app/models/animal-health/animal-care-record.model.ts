export type AnimalCareType = 'vaccine' | 'deworming' | 'appointment';
export type AnimalCareStatus = 'pending' | 'completed';
export type AnimalCareTimelineState =
  | 'overdue'
  | 'due_soon'
  | 'scheduled'
  | 'completed'
  | 'unscheduled';

export interface AnimalCareAnimal {
  id: string;
  name: string;
  speciesName: string | null;
  breedName: string | null;
  status: string | null;
}

export interface AnimalCareRecord {
  id: string;
  animalId: string;
  animal: AnimalCareAnimal;
  type: AnimalCareType;
  title: string;
  detail: string | null;
  status: AnimalCareStatus;
  scheduledDate: string | null;
  completedDate: string | null;
  nextDueDate: string | null;
  notes: string | null;
  createdAt: string;
}
