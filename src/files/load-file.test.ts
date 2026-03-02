import { afterEach, describe, expect, it, vi } from 'vitest';

import loadFile from './load-file.ts';

afterEach(() => {
  vi.unstubAllGlobals();
  delete (window as unknown as Record<string, unknown>).__TAURI__;
});

describe('loadFile (web)', () => {
  it('fetches and returns a File with the last path segment as name', async () => {
    const blob = new Blob(['hello'], { type: 'text/plain' });

    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          ({
            ok: true,
            status: 200,
            blob: async () => blob,
          }) as unknown as Response
      )
    );

    const file = await loadFile('https://example.com/assets/track.mp3?x=1');
    expect(file.name).toBe('track.mp3');
    expect(file.type).toBe('text/plain');
  });

  it('throws when fetch response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          ({
            ok: false,
            status: 404,
          }) as unknown as Response
      )
    );

    await expect(loadFile('/missing-file.mp3')).rejects.toThrow('Failed to fetch /missing-file.mp3');
  });
});
