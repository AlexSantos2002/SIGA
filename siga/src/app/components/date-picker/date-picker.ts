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

    return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index);
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

    const selectedDate = this.parseDateValue(this.value);
    this.viewDate = selectedDate ?? this.viewDate ?? new Date();
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
  }

  nextMonth(): void {
    this.viewDate = new Date(this.viewYear, this.viewMonth + 1, 1);
  }

  changeMonth(month: string): void {
    this.viewDate = new Date(this.viewYear, Number(month), 1);
  }

  changeYear(year: string): void {
    this.viewDate = new Date(Number(year), this.viewMonth, 1);
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
}
