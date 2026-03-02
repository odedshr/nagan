import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { openInModal } from './modal.ts';

beforeEach(() => {
  // jsdom doesn't implement <dialog>.showModal() in some versions.
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

describe('openInModal', () => {
  it('renders a dialog, resolves on submit, and removes itself after 200ms', async () => {
    const formFactory = (props: { message: string; onSubmit: (value: number) => void }) => {
      const form = document.createElement('form') as HTMLFormElement;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = props.message;
      button.onclick = () => props.onSubmit(123);
      form.appendChild(button);
      return form;
    };

    const promise = openInModal<number, { message: string; onSubmit: (value: number) => void }>(formFactory, {
      message: 'Go',
      onSubmit: () => {},
    });

    const dialog = document.querySelector('dialog') as HTMLDialogElement | null;
    expect(dialog).not.toBeNull();
    expect(dialog?.classList.contains('modal-open')).toBe(true);

    // Only enable fake timers after the requestAnimationFrame callback ran.
    vi.useFakeTimers();

    const button = dialog!.querySelector('button') as HTMLButtonElement;
    button.click();

    await vi.advanceTimersByTimeAsync(200);
    await expect(promise).resolves.toBe(123);
    expect(document.querySelector('dialog')).toBeNull();
  });
});
