/**
 * @description
 * Impede que uma chamada à Supabase fique presa indefinidamente.
 */
export async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs = 10000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = globalThis.setTimeout(
      () => reject(new Error('Tempo limite ao contactar a Supabase.')),
      timeoutMs,
    );

    Promise.resolve(promise).then(
      (value) => {
        globalThis.clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        globalThis.clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

/**
 * Repete uma operação assíncrona quando uma falha transitória ocorre.
 */
export async function retryAsync<T>(
  operation: () => Promise<T>,
  attempts = 2,
  delayMs = 350,
): Promise<T> {
  const totalAttempts = Math.max(1, attempts);
  let lastError: unknown;

  for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt < totalAttempts && delayMs > 0) {
        await new Promise<void>((resolve) => globalThis.setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
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
