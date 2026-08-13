import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import {
  AnimalCareRecord,
  AnimalCareType,
} from '../../../models/animal-health/animal-care-record.model';
import { AnimalCareService } from '../../../services/animal-health/animal-care.service';
import { LoadingService } from '../../../services/services/loading.service';
import {
  CalendarDay,
  CalendarEvent,
  CalendarFilterType,
  buildCalendarDays,
  createCalendarEvents,
} from './calendar.helpers';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Calendar implements OnInit {
  careRecords: AnimalCareRecord[] = [];
  displayedMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  selectedDateKey: string | null = null;
  filterType: CalendarFilterType = 'all';
  popoverStyle: Record<string, string> = {};
  isLoading = true;
  errorMessage = '';

  readonly filterOptions: { value: CalendarFilterType; label: string }[] = [
    { value: 'all', label: $localize`:@@calendar.filter.all:Todos os eventos` },
    { value: 'vaccine', label: $localize`:@@calendar.filter.vaccines:Vacinas` },
    {
      value: 'deworming',
      label: $localize`:@@calendar.filter.dewormings:Desparasitações`,
    },
    { value: 'appointment', label: $localize`:@@calendar.filter.appointments:Consultas` },
  ];

  constructor(
    private animalCareService: AnimalCareService,
    private loading: LoadingService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadEvents();
  }

  get calendarEvents(): CalendarEvent[] {
    const events = createCalendarEvents(this.careRecords);

    return this.filterType === 'all'
      ? events
      : events.filter((event) => event.record.type === this.filterType);
  }

  get weekdays(): string[] {
    return Array.from({ length: 7 }, (_, index) =>
      new Intl.DateTimeFormat(this.locale, { weekday: 'short' }).format(
        new Date(2026, 0, 5 + index),
      ),
    );
  }

  get calendarDays(): CalendarDay[] {
    return buildCalendarDays(this.displayedMonth, this.calendarEvents);
  }

  get selectedEvents(): CalendarEvent[] {
    if (!this.selectedDateKey) {
      return [];
    }

    return this.calendarEvents.filter((event) => event.dateKey === this.selectedDateKey);
  }

  get monthEventCount(): number {
    return this.calendarEvents.filter(
      (event) =>
        event.date.getFullYear() === this.displayedMonth.getFullYear() &&
        event.date.getMonth() === this.displayedMonth.getMonth(),
    ).length;
  }

  get monthLabel(): string {
    return new Intl.DateTimeFormat(this.locale, {
      month: 'long',
      year: 'numeric',
    }).format(this.displayedMonth);
  }

  get selectedDateLabel(): string {
    if (!this.selectedDateKey) {
      return '';
    }

    const [year, month, day] = this.selectedDateKey.split('-').map(Number);

    const label = new Intl.DateTimeFormat(this.locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(year, month - 1, day));

    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  previousMonth(): void {
    this.changeMonth(-1);
  }

  nextMonth(): void {
    this.changeMonth(1);
  }

  goToToday(): void {
    const today = new Date();
    this.displayedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.closeSelectedDay();
  }

  selectDay(day: CalendarDay, mouseEvent: MouseEvent): void {
    if (this.selectedDateKey === day.dateKey) {
      this.closeSelectedDay();
      return;
    }

    this.setPopoverPosition(mouseEvent.currentTarget as HTMLElement);
    this.selectedDateKey = day.dateKey;

    if (!day.isCurrentMonth) {
      this.displayedMonth = new Date(day.date.getFullYear(), day.date.getMonth(), 1);
    }

  }

  getDayAriaLabel(day: CalendarDay): string {
    const dateLabel = new Intl.DateTimeFormat(this.locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(day.date);
    const countLabel =
      day.events.length === 1
        ? $localize`:@@calendar.aria.oneEvent:1 evento`
        : $localize`:@@calendar.aria.multipleEvents:${day.events.length}:EVENT_COUNT: eventos`;

    return `${dateLabel}, ${countLabel}`;
  }

  getCareTypeLabel(type: AnimalCareType): string {
    const labels: Record<AnimalCareType, string> = {
      vaccine: $localize`:@@calendar.type.vaccine:Vacina`,
      deworming: $localize`:@@calendar.type.deworming:Desparasitação`,
      appointment: $localize`:@@calendar.type.appointment:Consulta`,
    };

    return labels[type];
  }

  getAnimalDescription(event: CalendarEvent): string {
    return [event.record.animal.speciesName, event.record.animal.breedName]
      .filter(Boolean)
      .join(' / ');
  }

  trackByDateKey(_index: number, day: CalendarDay): string {
    return day.dateKey;
  }

  trackByEventKey(_index: number, event: CalendarEvent): string {
    return event.key;
  }

  closeSelectedDay(): void {
    this.selectedDateKey = null;
    this.popoverStyle = {};
  }

  @HostListener('document:keydown.escape')
  closeSelectedDayOnEscape(): void {
    if (this.selectedDateKey) {
      this.closeSelectedDay();
    }
  }

  async retry(): Promise<void> {
    await this.loadEvents();
  }

  private changeMonth(offset: number): void {
    this.displayedMonth = new Date(
      this.displayedMonth.getFullYear(),
      this.displayedMonth.getMonth() + offset,
      1,
    );
    this.selectedDateKey = null;
  }

  private get locale(): string {
    return document.documentElement.lang || 'pt-PT';
  }

  private setPopoverPosition(trigger: HTMLElement): void {
    const calendarCard = trigger.closest('.calendar-card');

    if (!(calendarCard instanceof HTMLElement)) {
      this.popoverStyle = {};
      return;
    }

    const cardRect = calendarCard.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const horizontalMargin = 12;
    const panelWidth = Math.min(520, Math.max(0, cardRect.width - horizontalMargin * 2));
    const triggerCenterX = triggerRect.left - cardRect.left + triggerRect.width / 2;
    const triggerCenterY = triggerRect.top - cardRect.top + triggerRect.height / 2;
    const left = Math.min(
      Math.max(triggerCenterX - panelWidth / 2, horizontalMargin),
      cardRect.width - panelWidth - horizontalMargin,
    );
    const minimumTop = 48;
    const maximumTop = Math.max(minimumTop, cardRect.height - 330);
    const top = Math.min(Math.max(triggerCenterY - 50, minimumTop), maximumTop);

    this.popoverStyle = {
      left: `${left}px`,
      top: `${top}px`,
      width: `${panelWidth}px`,
      'max-height': `${Math.max(220, cardRect.height - top - 12)}px`,
      '--popover-origin-x': `${triggerCenterX - left}px`,
      '--popover-origin-y': `${triggerCenterY - top}px`,
    };
  }

  private async loadEvents(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();
      this.loading.start();
      this.careRecords = await this.animalCareService.getAll();
    } catch (error: any) {
      console.error('Erro ao carregar calendário:', error);
      this.errorMessage =
        error?.message ||
        error?.details ||
        $localize`:@@calendar.loadError:Não foi possível carregar os eventos do calendário.`;
    } finally {
      this.loading.stop();
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
}
