import {
  AnimalCareRecord,
  AnimalCareType,
} from '../../../models/animal-health/animal-care-record.model';

export type CalendarFilterType = 'all' | AnimalCareType;
export type CalendarEventDateKind = 'scheduled' | 'completed' | 'next_due';

export interface CalendarEvent {
  key: string;
  record: AnimalCareRecord;
  date: Date;
  dateKey: string;
  dateKind: CalendarEventDateKind;
  dateLabel: string;
}

export interface CalendarDay {
  date: Date;
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

const dateKindOrder: Record<CalendarEventDateKind, number> = {
  scheduled: 0,
  next_due: 1,
  completed: 2,
};

export function createCalendarEvents(records: AnimalCareRecord[]): CalendarEvent[] {
  return records
    .flatMap((record) => {
      const events: CalendarEvent[] = [];

      if (record.scheduledDate) {
        events.push(createCalendarEvent(record, record.scheduledDate, 'scheduled'));
      }

      if (record.nextDueDate) {
        events.push(createCalendarEvent(record, record.nextDueDate, 'next_due'));
      }

      if (record.completedDate) {
        events.push(createCalendarEvent(record, record.completedDate, 'completed'));
      }

      return events;
    })
    .sort((firstEvent, secondEvent) => {
      const dateResult = firstEvent.dateKey.localeCompare(secondEvent.dateKey);

      if (dateResult !== 0) {
        return dateResult;
      }

      return dateKindOrder[firstEvent.dateKind] - dateKindOrder[secondEvent.dateKind];
    });
}

export function buildCalendarDays(
  month: Date,
  events: CalendarEvent[],
  today = new Date(),
): CalendarDay[] {
  const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayBasedOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const firstGridDate = new Date(month.getFullYear(), month.getMonth(), 1 - mondayBasedOffset);
  const todayKey = toDateKey(today);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      firstGridDate.getFullYear(),
      firstGridDate.getMonth(),
      firstGridDate.getDate() + index,
    );
    const dateKey = toDateKey(date);

    return {
      date,
      dateKey,
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === month.getMonth(),
      isToday: dateKey === todayKey,
      events: events.filter((event) => event.dateKey === dateKey),
    };
  });
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function createCalendarEvent(
  record: AnimalCareRecord,
  value: string,
  dateKind: CalendarEventDateKind,
): CalendarEvent {
  const dateKey = value.slice(0, 10);
  const [year, month, day] = dateKey.split('-').map(Number);

  return {
    key: `${record.type}:${record.id}:${dateKind}:${dateKey}`,
    record,
    date: new Date(year, month - 1, day),
    dateKey,
    dateKind,
    dateLabel: getDateLabel(record.type, dateKind),
  };
}

function getDateLabel(type: AnimalCareType, dateKind: CalendarEventDateKind): string {
  if (dateKind === 'completed') {
    return type === 'appointment'
      ? $localize`:@@calendar.dateKind.appointmentCompleted:Consulta realizada`
      : $localize`:@@calendar.dateKind.careCompleted:Cuidado realizado`;
  }

  if (dateKind === 'scheduled') {
    return type === 'appointment'
      ? $localize`:@@calendar.dateKind.appointmentScheduled:Consulta marcada`
      : $localize`:@@calendar.dateKind.scheduled:Data prevista`;
  }

  const labels: Record<AnimalCareType, string> = {
    vaccine: $localize`:@@calendar.dateKind.nextVaccine:Próxima dose`,
    deworming: $localize`:@@calendar.dateKind.nextDeworming:Próxima desparasitação`,
    appointment: $localize`:@@calendar.dateKind.nextAppointment:Próxima consulta`,
  };

  return labels[type];
}
