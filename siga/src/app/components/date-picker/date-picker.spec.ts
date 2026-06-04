import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatePicker } from './date-picker';

describe('DatePicker', () => {
  let component: DatePicker;
  let fixture: ComponentFixture<DatePicker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatePicker],
    }).compileComponents();

    fixture = TestBed.createComponent(DatePicker);
    component = fixture.componentInstance;
  });

  it('normalizes and displays date-only values', () => {
    component.writeValue('2026-06-04T10:30:00Z');

    expect(component.value).toBe('2026-06-04');
    expect(component.displayValue).toBe('04/06/2026');
  });

  it('keeps day selection available after changing month and year', () => {
    let selectedValue: string | null = null;

    component.registerOnChange((value) => {
      selectedValue = value;
    });
    component.openCalendar();
    component.changeYear('2026');
    component.changeMonth('5');

    const day = component.calendarDays.find((calendarDay) => calendarDay.dateValue === '2026-06-15');

    expect(day).toBeTruthy();

    component.selectDate(day!);

    expect(selectedValue).toBe('2026-06-15');
    expect(component.value).toBe('2026-06-15');
    expect(component.isOpen).toBe(false);
  });
});
