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

  afterEach(() => {
    vi.useRealTimers();
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

    const day = component.calendarDays.find(
      (calendarDay) => calendarDay.dateValue === '2026-06-15',
    );

    expect(day).toBeTruthy();

    component.selectDate(day!);

    expect(selectedValue).toBe('2026-06-15');
    expect(component.value).toBe('2026-06-15');
    expect(component.isOpen).toBe(false);
  });

  it('opens on the current month and year instead of the selected date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 9));

    component.writeValue('1926-01-01');
    component.openCalendar();

    expect(component.viewMonth).toBe(5);
    expect(component.viewYear).toBe(2026);
  });

  it('shows the current month and year in the dropdowns when opened', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 9));

    component.writeValue(null);
    component.openCalendar();
    fixture.detectChanges();

    const selects = fixture.nativeElement.querySelectorAll('select');
    const monthSelect = selects[0] as HTMLSelectElement;
    const yearSelect = selects[1] as HTMLSelectElement;

    expect(monthSelect.value).toBe('5');
    expect(monthSelect.selectedOptions[0].textContent?.trim()).toBe('Junho');
    expect(yearSelect.value).toBe('2026');
  });

  it('lists the visible year first so the dropdown starts near the current year', () => {
    component.startYear = 1926;
    component.endYear = 2046;
    component.viewDate = new Date(2026, 5, 9);

    expect(component.years[0]).toBe(2026);
    expect(component.years).toContain(1926);
    expect(component.years).toContain(2046);
  });
});
