export type MusicBrainzRecordingGenresQuery = {
  title: string;
  artists?: string | string[];
};

type MusicBrainzRecordingSearchResponse = {
  recordings?: Array<{
    score?: number;
    title?: string;
    genres?: Array<{ name: string; count?: number }>;
    tags?: Array<{ name: string; count?: number }>;
  }>;
};

const cache = new Map<string, string[] | null>();

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

function normalizeArtist(artists?: string | string[]): string {
  if (!artists) return '';
  if (Array.isArray(artists)) return artists.filter(Boolean)[0] || '';
  return artists;
}

function keyOf({ title, artists }: MusicBrainzRecordingGenresQuery): string {
  return `${normalizeArtist(artists).trim().toLowerCase()}|${title.trim().toLowerCase()}`;
}

function sortByCountDesc<T extends { count?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
}

function uniqueCaseInsensitive(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const norm = v.trim().toLowerCase();
    if (!norm) continue;
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push(v.trim());
  }
  return out;
}

function buildRecordingSearchUrl({ title, artists }: MusicBrainzRecordingGenresQuery): string {
  const artist = normalizeArtist(artists).trim();
  const safeTitle = title.trim();

  const parts: string[] = [];
  if (safeTitle) parts.push(`recording:"${safeTitle.replace(/"/g, '')}"`);
  if (artist) parts.push(`artist:"${artist.replace(/"/g, '')}"`);

  const query = parts.join(' AND ');

  const url = new URL('https://musicbrainz.org/ws/2/recording/');
  url.searchParams.set('query', query);
  url.searchParams.set('fmt', 'json');
  url.searchParams.set('limit', '5');
  url.searchParams.set('inc', 'genres+tags');

  return url.toString();
}

async function fetchJsonWithRetry(url: string, attempts = 2): Promise<unknown> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (res.status === 429 || res.status === 503) {
        // MusicBrainz rate limits fairly aggressively; pause and retry.
        await sleep(1100);
        continue;
      }

      if (!res.ok) {
        throw new Error(`MusicBrainz HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      lastError = err;
      await sleep(1100);
    }
  }

  throw lastError;
}

export async function getMusicBrainzGenres(
  query: MusicBrainzRecordingGenresQuery,
  options: { maxGenres?: number; minScore?: number } = {}
): Promise<string[] | null> {
  const maxGenres = options.maxGenres ?? 5;
  const minScore = options.minScore ?? 50;

  if (!query.title?.trim()) return null;

  const cacheKey = keyOf(query);
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) ?? null;
  }

  try {
    const url = buildRecordingSearchUrl(query);
    const json = (await fetchJsonWithRetry(url)) as MusicBrainzRecordingSearchResponse;

    const recordings = json.recordings ?? [];
    if (recordings.length === 0) {
      cache.set(cacheKey, null);
      return null;
    }

    const best = recordings.filter(r => (r.score ?? 0) >= minScore).sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];

    if (!best) {
      cache.set(cacheKey, null);
      return null;
    }

    const fromGenres = best.genres ? sortByCountDesc(best.genres).map(g => g.name) : [];
    const fromTags = best.tags ? sortByCountDesc(best.tags).map(t => t.name) : [];

    const merged = uniqueCaseInsensitive([...fromGenres, ...fromTags]).slice(0, maxGenres);
    const result = merged.length ? merged : null;

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.warn('MusicBrainz lookup failed:', error);
    cache.set(cacheKey, null);
    return null;
  }
}
