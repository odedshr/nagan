import { afterEach, describe, expect, it, vi } from 'vitest';

import throttle from './throttle.ts';

afterEach(() => {
  vi.useRealTimers();
});

describe('throttle (trailing)', () => {
  it('runs once per burst with the latest args', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);

    throttled(1);
    throttled(2);
    throttled(3);

    expect(fn).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(999);
    expect(fn).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);

    throttled(4);
    await vi.advanceTimersByTimeAsync(1000);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(4);
  });
});
