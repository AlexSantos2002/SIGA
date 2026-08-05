export type AnimalHistoryEventType =
  | 'animal'
  | 'adoption'
  | 'vaccine'
  | 'deworming'
  | 'appointment';

export type AnimalHistoryEventState = 'info' | 'pending' | 'completed';

export interface AnimalHistoryEvent {
  id: string;
  type: AnimalHistoryEventType;
  state: AnimalHistoryEventState;
  title: string;
  badge: string;
  eventDate: string;
  createdAt: string;
  details: string[];
}
