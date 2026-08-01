import { describe, expect, it, vi } from 'vitest';

import { retryAsync, withTimeout } from './utils';

describe('async utilities', () => {
  it('retries a failed operation and returns the successful result', async () => {
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('Falha transitória'))
      .mockResolvedValue('ok');

    await expect(retryAsync(operation, 2, 0)).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('does not retry after the configured number of attempts', async () => {
    const operation = vi.fn<() => Promise<string>>().mockRejectedValue(new Error('Falha'));

    await expect(retryAsync(operation, 2, 0)).rejects.toThrow('Falha');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('clears the timeout after the operation succeeds', async () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    await expect(withTimeout(Promise.resolve('ok'), 1000)).resolves.toBe('ok');
    expect(clearTimeoutSpy).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });
});
