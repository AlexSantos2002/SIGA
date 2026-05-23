/**
 * @description
 * Impede que uma chamada à Supabase fique presa indefinidamente.
 */
export async function withTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMs = 10000
): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error('Tempo limite ao contactar a Supabase.')),
        timeoutMs
      )
    ),
  ]);
}
