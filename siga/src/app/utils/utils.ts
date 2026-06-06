/**
 * @description
 * Impede que uma chamada à Supabase fique presa indefinidamente.
 */
export async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs = 10000): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Tempo limite ao contactar a Supabase.')), timeoutMs),
    ),
  ]);
}

export function toNullableString(value: string | null | undefined): string | null {
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue : null;
}

export function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function parseDateOnly(dateValue: string): Date | null {
  const [year, month, day] = dateValue.split('-').map((part) => Number(part));

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

export function getDaysUntil(dateValue: string): number {
  const targetDate = parseDateOnly(dateValue);

  if (!targetDate) {
    return 0;
  }

  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  return Math.round((targetDate.getTime() - todayDate.getTime()) / millisecondsPerDay);
}
