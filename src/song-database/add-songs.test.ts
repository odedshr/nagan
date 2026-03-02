import { describe, expect, it, vi } from 'vitest';

import { initState } from '../utils/init-state.ts';
import getOnEvent from '../utils/on-event.ts';
import type { Song, SongMetadata, State, StateBase } from '../types.ts';
import type { BackendService } from '../backend/backend.ts';
import processSongs from './process-songs.ts';
import { addSongsToPlaylist } from './add-songs-to-playlist.ts';

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
    dbQuery: initState({
      groupBy: [],
      columns: ['title', 'album', 'artists', 'duration', 'genre', 'bpm', 'comment'],
      filters: {},
      sort: [],
      pageSize: 10,
      pageNumber: 0,
    }),
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

describe('addSongs', () => {
  it('browseFiles delegates to selectFile + processSongs', async () => {
    vi.resetModules();

    const state = createState();
    const backendService = {
      addSong: vi.fn(),
      updateSong: vi.fn(),
      getSongBpm: vi.fn(),
    } as unknown as BackendService;

    const file = new File(['x'], 'a.mp3', { type: 'audio/mpeg' });
    const selectFileMock = vi.fn(async () => [file]);
    const processed = [song('1')];
    const processSongsMock = vi.fn(async () => processed);

    vi.doMock('../files/select-file.ts', () => ({ default: selectFileMock }));
    vi.doMock('./process-songs.ts', () => ({ default: processSongsMock }));

    const { browseFiles } = await import('./add-songs.ts');
    const onEvent = getOnEvent(state);
    const result = await browseFiles({
      onEvent,
      addSong: backendService.addSong,
      updateSong: backendService.updateSong,
    });

    expect(selectFileMock).toHaveBeenCalledTimes(1);
    expect(processSongsMock).toHaveBeenCalledWith({
      files: [file],
      onEvent,
      addSong: backendService.addSong,
      updateSong: backendService.updateSong,
      analyzeGenres: undefined,
      analyzeBpm: undefined,
    });
    expect(result).toEqual(processed);
  });

  it('processSongs adds songs, emits file-loaded, and de-dupes duplicate files', async () => {
    const state = createState();
    const backendService = {
      addSong: vi.fn(async () => song('1')),
      updateSong: vi.fn(async () => null),
    } as unknown as BackendService;

    const f1 = new File(['x'], 'a.mp3', { type: 'audio/mpeg' });
    const f2 = new File(['x'], 'a.mp3', { type: 'audio/mpeg' });

    const result = await processSongs({
      files: [f1, f2],
      onEvent: getOnEvent(state),
      addSong: backendService.addSong,
      updateSong: backendService.updateSong,
    });

    expect(backendService.addSong).toHaveBeenCalledTimes(1);
    expect(backendService.addSong).toHaveBeenCalledWith('a.mp3');
    expect(state.lastEvent?.type).toBe('file-loaded');
    expect(result).toEqual([song('1')]);
  });

  it('processSongs emits notification on backend error', async () => {
    const state = createState();
    const backendService = {
      addSong: vi.fn(async () => {
        throw new Error('boom');
      }),
      updateSong: vi.fn(async () => null),
    } as unknown as BackendService;

    const result = await processSongs({
      files: [new File(['x'], 'bad.mp3', { type: 'audio/mpeg' })],
      onEvent: getOnEvent(state),
      addSong: backendService.addSong,
      updateSong: backendService.updateSong,
    });

    expect(state.lastEvent?.type).toBe('notification');
    expect(result).toEqual([]);
  });

  it('processSongs runs analyzeGenres and persists genres via updateSong', async () => {
    const state = createState();
    const backendService = {
      addSong: vi.fn(async () => song('1', { genres: [] })),
      updateSong: vi.fn(async () => null),
    } as unknown as BackendService;

    const analyzeGenres = vi.fn(async (songs: Song[]) =>
      songs.map(s => ({ ...s, metadata: { ...s.metadata, genres: ['rock'] } }))
    );

    await processSongs({
      files: [new File(['x'], 'a.mp3', { type: 'audio/mpeg' })],
      onEvent: getOnEvent(state),
      addSong: backendService.addSong,
      updateSong: backendService.updateSong,
      analyzeGenres,
    });

    expect(analyzeGenres).toHaveBeenCalledTimes(1);
    expect(backendService.updateSong).toHaveBeenCalledWith({
      id: '1',
      metadata: { genres: ['rock'] },
      update_id3: true,
    });
  });

  it('processSongs runs analyzeBpm and persists bpm via updateSong', async () => {
    const state = createState();
    const backendService = {
      addSong: vi.fn(async () => song('1', { bpm: undefined })),
      updateSong: vi.fn(async () => null),
    } as unknown as BackendService;

    const analyzeBpm = vi.fn(async (songs: Song[]) =>
      songs.map(s => ({ ...s, metadata: { ...s.metadata, bpm: 120 } }))
    );

    await processSongs({
      files: [new File(['x'], 'a.mp3', { type: 'audio/mpeg' })],
      onEvent: getOnEvent(state),
      addSong: backendService.addSong,
      updateSong: backendService.updateSong,
      analyzeBpm,
    });

    expect(analyzeBpm).toHaveBeenCalledTimes(1);
    expect(backendService.updateSong).toHaveBeenCalledWith({ id: '1', metadata: { bpm: 120 }, update_id3: true });
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
