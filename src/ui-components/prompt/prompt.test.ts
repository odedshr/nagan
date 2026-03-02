import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import prompt from './prompt.ts';
import Prompt from './Prompt.tsx';

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

describe('Prompt', () => {
  it('submits the input value on submit when valid', () => {
    const onSubmit = vi.fn();
    const form = Prompt({ message: 'Name?', defaultValue: 'Ada', onSubmit });
    const input = form.querySelector('#prompt-input') as HTMLInputElement;
    input.value = 'Grace';

    form.onsubmit!({ target: form, preventDefault: vi.fn(), submitter: input } as unknown as SubmitEvent);
    expect(onSubmit).toHaveBeenCalledWith('Grace');
  });

  it('submits null on cancel', () => {
    const onSubmit = vi.fn();
    const form = Prompt({ message: 'Name?', onSubmit });
    const cancel = form.querySelector('button') as HTMLButtonElement;

    // jsdom doesn't always provide PointerEvent; a simple click is enough here.
    cancel.click();
    expect(onSubmit).toHaveBeenCalledWith(null);
  });
});

describe('prompt()', () => {
  it('resolves to the submitted value and cleans up modal', async () => {
    vi.useFakeTimers();

    const promise = prompt('Name?', 'Ada');
    const form = document.querySelector('form') as HTMLFormElement;
    const input = form.querySelector('#prompt-input') as HTMLInputElement;
    input.value = 'Grace';

    form.onsubmit!({ target: form, preventDefault: vi.fn(), submitter: input } as unknown as SubmitEvent);
    await vi.advanceTimersByTimeAsync(200);

    await expect(promise).resolves.toBe('Grace');
    expect(document.querySelector('dialog')).toBeNull();
  });
});
