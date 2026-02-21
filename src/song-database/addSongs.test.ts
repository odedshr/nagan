import { describe, expect, it, vi } from 'vitest';

import { Context } from '../utils/Context.ts';
import type { Song, SongMetadata, State, StateBase } from '../types.ts';
import type { BackendService } from '../backend/backend.ts';
import { addSongsToPlaylist, browseFile } from './addSongs.ts';

function song(id: string, metadata?: Partial<SongMetadata>): Song {
  return {
    id,
    url: `file://${id}`,
    filename: `${id}.mp3`,
    metadata: {
      title: id,
      album: 'a',
      duration: 1,
      artists: 'x',
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

describe('addSongs', () => {
  it('browseFile adds song, emits file-loaded, and refreshes', async () => {
    const state = createState();

    const backendService = {
      addSong: vi.fn(async () => song('1')),
    } as unknown as BackendService;

    const refreshDb = vi.fn(async () => undefined);
    const selectFiles = vi.fn(async () => [new File(['x'], 'a.mp3', { type: 'audio/mpeg' })]);

    await browseFile({ state, backendService, refreshDb, selectFiles });

    // wait for the internal forEach async task
    await new Promise(r => setTimeout(r, 0));

    expect(backendService.addSong).toHaveBeenCalledWith('a.mp3');
    expect(state.lastEvent?.type).toBe('file-loaded');
    expect(refreshDb).toHaveBeenCalledTimes(1);
  });

  it('browseFile emits notification on backend error', async () => {
    const state = createState();

    const backendService = {
      addSong: vi.fn(async () => {
        throw new Error('boom');
      }),
    } as unknown as BackendService;

    const refreshDb = vi.fn(async () => undefined);
    const selectFiles = vi.fn(async () => [new File(['x'], 'bad.mp3', { type: 'audio/mpeg' })]);

    await browseFile({ state, backendService, refreshDb, selectFiles });

    await new Promise(r => setTimeout(r, 0));

    expect(state.lastEvent?.type).toBe('notification');
  });

  it('addSongsToPlaylist routes queue to enqueueSongsFn', async () => {
    const state = createState();
    const songs = [song('s1'), song('s2')];

    const enqueueSongsFn = vi.fn(async () => undefined);
    const backendService = {
      addSongToPlaylist: vi.fn(),
      getPlaylistSongs: vi.fn(),
    } as unknown as BackendService;

    await addSongsToPlaylist({ playlistId: 'queue', songs, backendService, state, enqueueSongsFn });

    expect(enqueueSongsFn).toHaveBeenCalledTimes(1);
    expect(backendService.addSongToPlaylist).not.toHaveBeenCalled();
  });

  it('addSongsToPlaylist adds songs and refreshes playlistSongs when active playlist', async () => {
    const state = createState({ currentPlaylistId: 'p1', playlistSongs: [] });
    const songs = [song('s1'), song('s2')];

    const backendService = {
      addSongToPlaylist: vi.fn(async () => undefined),
      getPlaylistSongs: vi.fn(async () => [song('x')]),
    } as unknown as BackendService;

    await addSongsToPlaylist({ playlistId: 'p1', songs, backendService, state });

    expect(backendService.addSongToPlaylist).toHaveBeenCalledTimes(2);
    expect(backendService.getPlaylistSongs).toHaveBeenCalledWith({ playlistId: 'p1' });
    expect(state.playlistSongs).toEqual([song('x')]);
  });
});
