import {
  createSortState,
  getInitialSortDirection,
  getNextSortState,
  getSortAriaLabel,
  getSortIndicator,
  SortConfig,
  sortItems,
} from './table-sort';

type TestSortField = 'name' | 'createdAt' | 'status';

interface TestItem {
  name: string | null;
  createdAt: string | null;
  status: 'available' | 'adopted';
  order: number;
}

const sortConfig: SortConfig<TestItem, TestSortField> = {
  name: {
    value: (item) => item.name,
  },
  createdAt: {
    value: (item) => item.createdAt,
    type: 'date',
    initialDirection: 'desc',
  },
  status: {
    value: (item) => item.status,
    priority: (item) => (item.status === 'available' ? 0 : 1),
  },
};

describe('table sort utils', () => {
  it('uses the configured initial direction and then toggles the selected field', () => {
    let state = createSortState<TestSortField>();

    expect(getSortIndicator(state, 'createdAt')).toBe('↕');
    expect(getSortAriaLabel('Registado em', state, 'createdAt')).toBe('Ordenar por Registado em');

    state = getNextSortState(state, 'createdAt', getInitialSortDirection(sortConfig, 'createdAt'));

    expect(state).toEqual({
      field: 'createdAt',
      direction: 'desc',
    });
    expect(getSortIndicator(state, 'createdAt')).toBe('↓');

    state = getNextSortState(state, 'createdAt', getInitialSortDirection(sortConfig, 'createdAt'));

    expect(state).toEqual({
      field: 'createdAt',
      direction: 'asc',
    });
    expect(getSortIndicator(state, 'createdAt')).toBe('↑');
    expect(getSortAriaLabel('Registado em', state, 'createdAt')).toBe(
      'Ordenado por Registado em em ordem crescente. Clicar para inverter.',
    );
  });

  it('sorts text values with empty values last and keeps equal rows stable', () => {
    const items: TestItem[] = [
      { name: 'Beta', createdAt: null, status: 'available', order: 0 },
      { name: 'Alpha', createdAt: null, status: 'available', order: 1 },
      { name: 'Alpha', createdAt: null, status: 'available', order: 2 },
      { name: null, createdAt: null, status: 'available', order: 3 },
    ];

    const sorted = sortItems(items, { field: 'name', direction: 'asc' }, sortConfig);

    expect(sorted.map((item) => item.order)).toEqual([1, 2, 0, 3]);
  });

  it('sorts dates and custom priorities through the same shared path', () => {
    const items: TestItem[] = [
      { name: 'First', createdAt: '2026-01-01', status: 'adopted', order: 0 },
      { name: 'Second', createdAt: '2026-03-01', status: 'available', order: 1 },
      { name: 'Third', createdAt: null, status: 'available', order: 2 },
    ];

    const byNewest = sortItems(items, { field: 'createdAt', direction: 'desc' }, sortConfig);
    const byStatus = sortItems(items, { field: 'status', direction: 'asc' }, sortConfig);

    expect(byNewest.map((item) => item.order)).toEqual([1, 0, 2]);
    expect(byStatus.map((item) => item.order)).toEqual([1, 2, 0]);
  });
});
