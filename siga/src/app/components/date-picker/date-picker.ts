import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

interface CalendarDay {
  date: Date;
  dateValue: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  disabled: boolean;
}

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-picker.html',
  styleUrl: './date-picker.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePicker),
      multi: true,
    },
  ],
})
export class DatePicker implements ControlValueAccessor {
  private static nextId = 0;

  @Input() inputId = `date-picker-${DatePicker.nextId++}`;
  @Input() placeholder = 'dd/mm/aaaa';
  @Input() min: string | null = null;
  @Input() max: string | null = null;
  @Input() startYear = new Date().getFullYear() - 100;
  @Input() endYear = new Date().getFullYear() + 20;

  isOpen = false;
  isDisabled = false;
  value: string | null = null;
  viewDate = new Date();
  panelStyle: Record<string, string> = {};

  readonly panelId = `date-picker-panel-${DatePicker.nextId++}`;
  readonly weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
  readonly months = [
    'Janeiro',
    'Fevereiro',
    'Marco',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};
  private readonly panelMaxWidth = 320;
  private readonly panelMinWidth = 260;
  private readonly panelEstimatedHeight = 342;
  private readonly viewportPadding = 8;

  constructor(private host: ElementRef<HTMLElement>) {}

  get displayValue(): string {
    const date = this.parseDateValue(this.value);

    if (!date) {
      return '';
    }

    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  get viewMonth(): number {
    return this.viewDate.getMonth();
  }

  get viewYear(): number {
    return this.viewDate.getFullYear();
  }

  get years(): number[] {
    const firstYear = Math.min(this.startYear, this.endYear, this.viewYear);
    const lastYear = Math.max(this.startYear, this.endYear, this.viewYear);
    const previousYears = Array.from(
      { length: this.viewYear - firstYear },
      (_, index) => this.viewYear - index - 1,
    );
    const nextYears = Array.from(
      { length: lastYear - this.viewYear },
      (_, index) => this.viewYear + index + 1,
    );

    return [this.viewYear, ...previousYears, ...nextYears];
  }

  get calendarDays(): CalendarDay[] {
    const firstDayOfMonth = new Date(this.viewYear, this.viewMonth, 1);
    const mondayBasedWeekday = (firstDayOfMonth.getDay() + 6) % 7;
    const firstVisibleDate = new Date(this.viewYear, this.viewMonth, 1 - mondayBasedWeekday);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(
        firstVisibleDate.getFullYear(),
        firstVisibleDate.getMonth(),
        firstVisibleDate.getDate() + index,
      );
      const dateValue = this.toDateValue(date);

      return {
        date,
        dateValue,
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === this.viewMonth,
        isSelected: dateValue === this.value,
        isToday: dateValue === this.toDateValue(new Date()),
        disabled: this.isDateDisabled(dateValue),
      };
    });
  }

  get isTodayDisabled(): boolean {
    return this.isDateDisabled(this.toDateValue(new Date()));
  }

  writeValue(value: string | null | undefined): void {
    const normalizedValue = this.normalizeDateValue(value);
    this.value = normalizedValue;

    const selectedDate = this.parseDateValue(normalizedValue);
    this.viewDate = selectedDate ?? new Date();
  }

  registerOnChange(onChange: (value: string | null) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;

    if (isDisabled) {
      this.isOpen = false;
    }
  }

  openCalendar(): void {
    if (this.isDisabled) {
      return;
    }

    this.viewDate = new Date();
    this.panelStyle = this.getPanelStyle();
    this.isOpen = true;
  }

  toggleCalendar(): void {
    if (this.isOpen) {
      this.closeCalendar();
      return;
    }

    this.openCalendar();
  }

  closeCalendar(markAsTouched = true): void {
    this.isOpen = false;

    if (markAsTouched) {
      this.markAsTouched();
    }
  }

  previousMonth(): void {
    this.viewDate = new Date(this.viewYear, this.viewMonth - 1, 1);
    this.updatePanelPosition();
  }

  nextMonth(): void {
    this.viewDate = new Date(this.viewYear, this.viewMonth + 1, 1);
    this.updatePanelPosition();
  }

  changeMonth(month: string): void {
    this.viewDate = new Date(this.viewYear, Number(month), 1);
    this.updatePanelPosition();
  }

  changeYear(year: string): void {
    this.viewDate = new Date(Number(year), this.viewMonth, 1);
    this.updatePanelPosition();
  }

  selectDate(day: CalendarDay): void {
    if (day.disabled || this.isDisabled) {
      return;
    }

    this.value = day.dateValue;
    this.viewDate = day.date;
    this.onChange(this.value);
    this.markAsTouched();
    this.closeCalendar(false);
  }

  selectToday(): void {
    const today = this.toDateValue(new Date());

    if (this.isDateDisabled(today)) {
      return;
    }

    const date = this.parseDateValue(today);

    if (!date) {
      return;
    }

    this.selectDate({
      date,
      dateValue: today,
      dayNumber: date.getDate(),
      isCurrentMonth: true,
      isSelected: today === this.value,
      isToday: true,
      disabled: false,
    });
  }

  clearDate(event: MouseEvent): void {
    event.stopPropagation();

    if (this.isDisabled) {
      return;
    }

    this.value = null;
    this.onChange(null);
    this.markAsTouched();
    this.closeCalendar(false);
  }

  handleInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.openCalendar();
      return;
    }

    if (event.key === 'Escape') {
      this.closeCalendar();
    }
  }

  trackByDateValue(_index: number, day: CalendarDay): string {
    return day.dateValue;
  }

  markAsTouched(): void {
    this.onTouched();
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    if (!this.isOpen || this.host.nativeElement.contains(event.target as Node)) {
      return;
    }

    this.closeCalendar();
  }

  @HostListener('window:resize')
  handleWindowResize(): void {
    this.updatePanelPosition();
  }

  @HostListener('window:scroll')
  handleWindowScroll(): void {
    this.updatePanelPosition();
  }

  private normalizeDateValue(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (!match) {
      return null;
    }

    const dateValue = `${match[1]}-${match[2]}-${match[3]}`;

    return this.parseDateValue(dateValue) ? dateValue : null;
  }

  private parseDateValue(value: string | null): Date | null {
    if (!value) {
      return null;
    }

    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) {
      return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);
    const isValidDate =
      date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

    return isValidDate ? date : null;
  }

  private toDateValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private isDateDisabled(dateValue: string): boolean {
    const min = this.normalizeDateValue(this.min);
    const max = this.normalizeDateValue(this.max);

    return !!((min && dateValue < min) || (max && dateValue > max));
  }

  private updatePanelPosition(): void {
    if (!this.isOpen) {
      return;
    }

    this.panelStyle = this.getPanelStyle();
  }

  private getPanelStyle(): Record<string, string> {
    const rect = this.host.nativeElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth || this.panelMaxWidth;
    const viewportHeight = window.innerHeight || this.panelEstimatedHeight;
    const gap = 6;
    const panelWidth = Math.min(
      Math.max(rect.width || this.panelMinWidth, this.panelMinWidth),
      this.panelMaxWidth,
      viewportWidth - this.viewportPadding * 2,
    );
    const panelHeight = Math.min(
      this.panelEstimatedHeight,
      Math.max(this.panelMinWidth, viewportHeight - this.viewportPadding * 2),
    );
    const spaceBelow = viewportHeight - rect.bottom - gap - this.viewportPadding;
    const spaceAbove = rect.top - gap - this.viewportPadding;
    const shouldOpenAbove = spaceBelow < panelHeight && spaceAbove > spaceBelow;
    const top = shouldOpenAbove
      ? Math.max(this.viewportPadding, rect.top - panelHeight - gap)
      : Math.min(rect.bottom + gap, viewportHeight - this.viewportPadding - panelHeight);
    const left = Math.min(
      Math.max(this.viewportPadding, rect.left),
      viewportWidth - this.viewportPadding - panelWidth,
    );

    return {
      left: `${left}px`,
      maxHeight: `${panelHeight}px`,
      top: `${top}px`,
      width: `${panelWidth}px`,
    };
  }
}
