import { describe, expect, it, vi } from 'vitest';

import type { BackendService } from '../backend/backend.ts';
import type { Song, SongMetadata, State, StateBase } from '../types.ts';
import { Context } from '../utils/context.ts';
import { fetchSongs, filterSongsByArtist } from './song-queries.ts';

function song(id: string, metadata?: Partial<SongMetadata>): Song {
  return {
    id,
    url: `file://${id}`,
    filename: `${id}.mp3`,
    metadata: {
      title: id,
      album: 'a',
      duration: 1,
      artists: 'Miles Davis',
      genres: [],
      tags: [],
      file_exists: true,
      times_played: 0,
      ...metadata,
    },
    available: true,
  };
}

function createState(overrides: Partial<StateBase> = {}): State {
  const base: StateBase = {
    mode: 'database',
    currentTrack: null,
    playbackRate: 1,
    volume: 1,
    lastEvent: undefined,
    groupBy: [],
    dbFilters: {},
    playlists: [],
    currentPlaylistId: null,
    queue: [],
    repeat: 'none',
    currentSection: null,
    history: [],
    currentPlaylist: null,
    playlistSongs: [],
    cssTheme: 'default',
  };

  return Context<StateBase>({ ...base, ...overrides }) as unknown as State;
}

describe('songQueries', () => {
  it('fetchSongs passes dbFilters to backendService.getSongs and returns songs', async () => {
    const state = createState({ dbFilters: { album: 'Kind of Blue' } });

    const backendService = {
      getSongs: vi.fn(async () => ({ songs: [song('1')], total: 1 })),
    } as unknown as BackendService;

    const songs = await fetchSongs(state, backendService);

    expect(backendService.getSongs).toHaveBeenCalledWith({ filters: { album: 'Kind of Blue' } });
    expect(songs).toHaveLength(1);
    expect(songs[0].id).toBe('1');
  });

  it('fetchSongs returns [] on error', async () => {
    const state = createState();

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const backendService = {
      getSongs: vi.fn(async () => {
        throw new Error('boom');
      }),
    } as unknown as BackendService;

    const songs = await fetchSongs(state, backendService);
    expect(songs).toEqual([]);

    consoleError.mockRestore();
  });

  it('filterSongsByArtist returns original list when filter blank', () => {
    const songs = [song('1'), song('2')];
    expect(filterSongsByArtist(songs, '  ')).toBe(songs);
  });

  it('filterSongsByArtist matches case-insensitively across artists array', () => {
    const songs = [song('1', { artists: ['John Coltrane', 'Miles Davis'] }), song('2', { artists: 'Herbie Hancock' })];

    const result = filterSongsByArtist(songs, 'miles');

    expect(result.map(s => s.id)).toEqual(['1']);
  });
});
