import { AnimalCareRecord } from '../../../models/animal-health/animal-care-record.model';
import { buildCalendarDays, createCalendarEvents } from './calendar.helpers';

describe('calendar helpers', () => {
  const record: AnimalCareRecord = {
    id: 'care-1',
    animalId: 'animal-1',
    animal: {
      id: 'animal-1',
      name: 'Luna',
      speciesName: 'Cão',
      breedName: null,
      status: 'disponivel',
    },
    type: 'vaccine',
    title: 'Raiva',
    detail: null,
    status: 'completed',
    scheduledDate: null,
    completedDate: '2026-08-03',
    nextDueDate: '2027-08-03',
    notes: null,
    createdAt: '2026-08-03T10:00:00Z',
  };

  it('creates one calendar event for every meaningful care date', () => {
    const events = createCalendarEvents([record]);

    expect(events.map((event) => event.dateKind)).toEqual(['completed', 'next_due']);
    expect(events.map((event) => event.dateKey)).toEqual(['2026-08-03', '2027-08-03']);
  });

  it('builds a six-week grid starting on Monday', () => {
    const days = buildCalendarDays(
      new Date(2026, 7, 1),
      createCalendarEvents([record]),
      new Date(2026, 7, 3),
    );

    expect(days).toHaveLength(42);
    expect(days[0].dateKey).toBe('2026-07-27');
    expect(days.find((day) => day.dateKey === '2026-08-03')?.events).toHaveLength(1);
    expect(days.find((day) => day.dateKey === '2026-08-03')?.isToday).toBe(true);
  });
});
