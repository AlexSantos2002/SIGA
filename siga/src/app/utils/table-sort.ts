export type SortDirection = 'asc' | 'desc';
export type SortValue = string | number | null | undefined;

export interface SortState<TField extends string> {
  field: TField | null;
  direction: SortDirection;
}

export interface SortFieldConfig<TItem> {
  value: (item: TItem) => SortValue;
  type?: 'text' | 'number' | 'date';
  initialDirection?: SortDirection;
  priority?: (item: TItem) => number | null | undefined;
}

export type SortConfig<TItem, TField extends string> = Record<TField, SortFieldConfig<TItem>>;

export function createSortState<TField extends string>(): SortState<TField> {
  return {
    field: null,
    direction: 'asc',
  };
}

export function getNextSortState<TField extends string>(
  state: SortState<TField>,
  field: TField,
  initialDirection: SortDirection = 'asc',
): SortState<TField> {
  if (state.field === field) {
    return {
      field,
      direction: state.direction === 'asc' ? 'desc' : 'asc',
    };
  }

  return {
    field,
    direction: initialDirection,
  };
}

export function getSortIndicator<TField extends string>(
  state: SortState<TField>,
  field: TField,
): string {
  if (state.field !== field) {
    return '↕';
  }

  return state.direction === 'asc' ? '↑' : '↓';
}

export function getSortAriaLabel<TField extends string>(
  label: string,
  state: SortState<TField>,
  field: TField,
): string {
  if (state.field !== field) {
    return `Ordenar por ${label}`;
  }

  const direction = state.direction === 'asc' ? 'crescente' : 'decrescente';

  return `Ordenado por ${label} em ordem ${direction}. Clicar para inverter.`;
}

export function sortItems<TItem, TField extends string>(
  items: TItem[],
  state: SortState<TField>,
  config: SortConfig<TItem, TField>,
): TItem[] {
  if (!state.field) {
    return items;
  }

  const fieldConfig = config[state.field];

  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const result = compareItems(left.item, right.item, fieldConfig, state.direction);

      return result || left.index - right.index;
    })
    .map(({ item }) => item);
}

export function getInitialSortDirection<TItem, TField extends string>(
  config: SortConfig<TItem, TField>,
  field: TField,
): SortDirection {
  return config[field].initialDirection ?? 'asc';
}

function compareItems<TItem>(
  firstItem: TItem,
  secondItem: TItem,
  config: SortFieldConfig<TItem>,
  direction: SortDirection,
): number {
  if (config.priority) {
    const priorityResult = compareNullableNumbers(
      config.priority(firstItem),
      config.priority(secondItem),
      direction,
    );

    if (priorityResult !== 0) {
      return priorityResult;
    }
  }

  const firstValue = config.value(firstItem);
  const secondValue = config.value(secondItem);

  if (config.type === 'date') {
    return compareNullableDates(firstValue, secondValue, direction);
  }

  if (config.type === 'number') {
    return compareNullableNumbers(firstValue, secondValue, direction);
  }

  return compareNullableText(firstValue, secondValue, direction);
}

function compareNullableText(
  firstValue: SortValue,
  secondValue: SortValue,
  direction: SortDirection,
): number {
  const firstText = typeof firstValue === 'string' ? firstValue.trim() : String(firstValue ?? '');
  const secondText =
    typeof secondValue === 'string' ? secondValue.trim() : String(secondValue ?? '');
  const emptyResult = compareEmptyValues(!firstText, !secondText);

  if (emptyResult !== null) {
    return emptyResult;
  }

  return (
    firstText.localeCompare(secondText, 'pt-PT', {
      sensitivity: 'base',
      numeric: true,
    }) * getDirectionMultiplier(direction)
  );
}

function compareNullableDates(
  firstValue: SortValue,
  secondValue: SortValue,
  direction: SortDirection,
): number {
  const firstTime = firstValue ? Date.parse(String(firstValue)) : Number.NaN;
  const secondTime = secondValue ? Date.parse(String(secondValue)) : Number.NaN;
  const emptyResult = compareEmptyValues(Number.isNaN(firstTime), Number.isNaN(secondTime));

  if (emptyResult !== null) {
    return emptyResult;
  }

  return (firstTime - secondTime) * getDirectionMultiplier(direction);
}

function compareNullableNumbers(
  firstValue: SortValue,
  secondValue: SortValue,
  direction: SortDirection,
): number {
  const firstNumber =
    firstValue === null || firstValue === undefined ? Number.NaN : Number(firstValue);
  const secondNumber =
    secondValue === null || secondValue === undefined ? Number.NaN : Number(secondValue);
  const emptyResult = compareEmptyValues(Number.isNaN(firstNumber), Number.isNaN(secondNumber));

  if (emptyResult !== null) {
    return emptyResult;
  }

  return (firstNumber - secondNumber) * getDirectionMultiplier(direction);
}

function compareEmptyValues(firstIsEmpty: boolean, secondIsEmpty: boolean): number | null {
  if (firstIsEmpty && secondIsEmpty) {
    return 0;
  }

  if (firstIsEmpty) {
    return 1;
  }

  if (secondIsEmpty) {
    return -1;
  }

  return null;
}

function getDirectionMultiplier(direction: SortDirection): number {
  return direction === 'asc' ? 1 : -1;
}