import { afterEach, describe, expect, it, vi } from 'vitest';

import selectFile from './select-file.ts';

afterEach(() => {
  vi.restoreAllMocks();
  delete (window as unknown as Record<string, unknown>).__TAURI__;
});

describe('selectFile (web)', () => {
  it('creates a hidden audio file input and resolves selected files', async () => {
    const originalCreate = document.createElement.bind(document);
    const created: HTMLInputElement[] = [];

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreate(tagName) as HTMLElement;
      if (tagName === 'input') {
        const input = el as HTMLInputElement;
        created.push(input);

        input.click = () => {
          const f = new File(['x'], 'track.mp3', { type: 'audio/mpeg' });
          Object.defineProperty(input, 'files', {
            value: [f],
            configurable: true,
          });
          input.dispatchEvent(new Event('change'));
        };
      }
      return el;
    });

    const files = await selectFile();
    expect(files).toHaveLength(1);
    expect(files[0]?.name).toBe('track.mp3');

    expect(created).toHaveLength(1);
    expect(created[0]?.accept).toBe('audio/*');
    expect(created[0]?.style.display).toBe('none');
  });

  it('resolves empty array when no files are selected', async () => {
    const originalCreate = document.createElement.bind(document);

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreate(tagName) as HTMLElement;
      if (tagName === 'input') {
        const input = el as HTMLInputElement;
        input.click = () => {
          Object.defineProperty(input, 'files', {
            value: null,
            configurable: true,
          });
          input.dispatchEvent(new Event('change'));
        };
      }
      return el;
    });

    const files = await selectFile();
    expect(files).toEqual([]);
  });
});
