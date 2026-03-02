import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import confirm from './confirm.ts';
import Confirm from './Confirm.tsx';

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    value: vi.fn(),
    configurable: true,
  });

  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Confirm', () => {
  it('calls onSubmit(true/false) based on clicked submitter button', () => {
    const onSubmit = vi.fn();
    const form = Confirm({ message: 'Are you sure?', onSubmit });

    const yes = form.querySelector('button[data-value="true"]') as HTMLButtonElement;
    const no = form.querySelector('button[data-value="false"]') as HTMLButtonElement;

    form.onsubmit!({ preventDefault: vi.fn(), submitter: yes } as unknown as SubmitEvent);
    form.onsubmit!({ preventDefault: vi.fn(), submitter: no } as unknown as SubmitEvent);

    expect(onSubmit).toHaveBeenNthCalledWith(1, true);
    expect(onSubmit).toHaveBeenNthCalledWith(2, false);
  });
});

describe('confirm()', () => {
  it('resolves true/false and cleans up modal', async () => {
    vi.useFakeTimers();

    const promise = confirm('Proceed?');
    const form = document.querySelector('form') as HTMLFormElement;
    const yes = form.querySelector('button[data-value="true"]') as HTMLButtonElement;

    form.onsubmit!({ preventDefault: vi.fn(), submitter: yes } as unknown as SubmitEvent);
    await vi.advanceTimersByTimeAsync(200);

    await expect(promise).resolves.toBe(true);
    expect(document.querySelector('dialog')).toBeNull();
  });
});
