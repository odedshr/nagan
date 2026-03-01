import { describe, expect, it, vi } from 'vitest';

import type { BackendService } from '../backend/backend.ts';
import type { Song, SongMetadata, State, StateBase } from '../types.ts';
import { initState } from '../utils/init-state.ts';
import { fetchSongs } from './song-queries.ts';

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
    dbColumns: ['title', 'album', 'artists', 'duration', 'genre', 'bpm', 'comment'],
    dbFilters: {},
    dbSort: [],
    playlists: [],
    currentPlaylistId: null,
    queue: [],
    repeat: 'none',
    currentSection: null,
    history: [],
    currentPlaylist: null,
    playlistSongs: [],
    preferences: initState({
      cssTheme: 'default',
      autoAnalyzeBpm: false,
      autoAnalyzeGenres: false,
    }),
  };

  return initState<StateBase>({ ...base, ...overrides }) as unknown as State;
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
});
