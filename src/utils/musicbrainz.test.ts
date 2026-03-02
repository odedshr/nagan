import { afterEach, describe, expect, it, vi } from 'vitest';

async function importFresh() {
  vi.resetModules();
  return await import('./musicbrainz.ts');
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('getMusicBrainzGenres', () => {
  it('returns null when title is empty', async () => {
    const { getMusicBrainzGenres } = await importFresh();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const res = await getMusicBrainzGenres({ title: '   ', artists: 'X' });
    expect(res).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('merges genres and tags, de-duplicates case-insensitively, and respects maxGenres', async () => {
    const { getMusicBrainzGenres } = await importFresh();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          ({
            ok: true,
            status: 200,
            json: async () => ({
              recordings: [
                {
                  score: 100,
                  title: 'Song',
                  genres: [
                    { name: 'Rock', count: 2 },
                    { name: ' rock ', count: 1 },
                  ],
                  tags: [
                    { name: 'Indie', count: 10 },
                    { name: 'rock', count: 9 },
                  ],
                },
              ],
            }),
          }) as unknown as Response
      )
    );

    const res = await getMusicBrainzGenres({ title: 'Song', artists: 'Artist' }, { maxGenres: 2 });
    expect(res).toEqual(['Rock', 'Indie']);
  });

  it('returns null when no recordings meet minScore', async () => {
    const { getMusicBrainzGenres } = await importFresh();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          ({
            ok: true,
            status: 200,
            json: async () => ({ recordings: [{ score: 10, genres: [{ name: 'Rock', count: 1 }] }] }),
          }) as unknown as Response
      )
    );

    const res = await getMusicBrainzGenres({ title: 'Song', artists: 'Artist' }, { minScore: 50 });
    expect(res).toBeNull();
  });

  it('caches results (including null) per title+artist', async () => {
    const { getMusicBrainzGenres } = await importFresh();
    const fetchMock = vi.fn(
      async () =>
        ({
          ok: true,
          status: 200,
          json: async () => ({ recordings: [] }),
        }) as unknown as Response
    );
    vi.stubGlobal('fetch', fetchMock);

    const query = { title: 'Song', artists: 'Artist' };
    const a = await getMusicBrainzGenres(query);
    const b = await getMusicBrainzGenres(query);
    expect(a).toBeNull();
    expect(b).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries on 429 and succeeds on a later attempt', async () => {
    vi.useFakeTimers();
    const { getMusicBrainzGenres } = await importFresh();

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 429 } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          recordings: [{ score: 100, genres: [{ name: 'Jazz', count: 1 }] }],
        }),
      } as unknown as Response);

    vi.stubGlobal('fetch', fetchMock);

    const promise = getMusicBrainzGenres({ title: 'Song', artists: 'Artist' });
    await vi.advanceTimersByTimeAsync(1100);
    const res = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(res).toEqual(['Jazz']);
  });

  it('returns null (and does not throw) on unexpected fetch errors', async () => {
    vi.useFakeTimers();
    const { getMusicBrainzGenres } = await importFresh();

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network');
      })
    );

    const promise = getMusicBrainzGenres({ title: 'Song', artists: 'Artist' });
    await vi.advanceTimersByTimeAsync(2200);
    const res = await promise;

    expect(res).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });
});
