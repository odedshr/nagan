import { describe, expect, it, vi } from 'vitest';

import { initState } from '../utils/init-state.ts';
import type { Song, SongMetadata, State, StateBase } from '../types.ts';
import type { BackendService } from '../backend/backend.ts';
import processSongs from './process-songs.ts';
import autoAnalyzeGenresForSong from './analyze-genres.ts';
import { autoAnalyzeBpmForSong } from './analyze-bpm.ts';
import { addSongsToPlaylist } from './add-songs-to-playlist.ts';

vi.mock('./analyze-genres.ts', () => ({
  default: vi.fn(async () => null),
}));

vi.mock('./analyze-bpm.ts', () => ({
  autoAnalyzeBpmForSong: vi.fn(async () => null),
}));

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

describe('addSongs', () => {
  it('browseFile delegates to selectFile + processSongs', async () => {
    vi.resetModules();

    const state = createState();
    const backendService = {} as unknown as BackendService;

    const file = new File(['x'], 'a.mp3', { type: 'audio/mpeg' });
    const selectFileMock = vi.fn(async () => [file]);
    const processed = [song('1')];
    const processSongsMock = vi.fn(async () => processed);

    vi.doMock('../files/select-file.ts', () => ({ default: selectFileMock }));
    vi.doMock('./process-songs.ts', () => ({ default: processSongsMock }));

    const { browseFile } = await import('./add-songs.ts');
    const result = await browseFile(state, backendService);

    expect(selectFileMock).toHaveBeenCalledTimes(1);
    expect(processSongsMock).toHaveBeenCalledWith([file], state, backendService);
    expect(result).toEqual(processed);
  });

  it('processSongs adds songs, emits file-loaded, and de-dupes duplicate files', async () => {
    const state = createState();
    const backendService = {
      addSong: vi.fn(async () => song('1')),
    } as unknown as BackendService;

    const f1 = new File(['x'], 'a.mp3', { type: 'audio/mpeg' });
    const f2 = new File(['x'], 'a.mp3', { type: 'audio/mpeg' });

    const result = await processSongs([f1, f2], state, backendService);

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
    } as unknown as BackendService;

    const result = await processSongs([new File(['x'], 'bad.mp3', { type: 'audio/mpeg' })], state, backendService);

    expect(state.lastEvent?.type).toBe('notification');
    expect(result).toEqual([]);
  });

  it('processSongs auto-analyzes genres when enabled and song has none', async () => {
    const state = createState({
      preferences: initState({
        cssTheme: 'default',
        autoAnalyzeBpm: false,
        autoAnalyzeGenres: true,
      }),
    });

    const backendService = {
      addSong: vi.fn(async () => song('1', { genres: [] })),
    } as unknown as BackendService;

    const autoAnalyzeGenresMock = vi.mocked(autoAnalyzeGenresForSong);
    autoAnalyzeGenresMock.mockClear();

    await processSongs([new File(['x'], 'a.mp3', { type: 'audio/mpeg' })], state, backendService);

    expect(autoAnalyzeGenresMock).toHaveBeenCalledTimes(1);
    expect(autoAnalyzeGenresMock.mock.calls[0]?.[0]).toBe(backendService);
    expect(autoAnalyzeGenresMock.mock.calls[0]?.[1]?.id).toBe('1');
  });

  it('processSongs auto-analyzes BPM when enabled and song has none', async () => {
    const state = createState({
      preferences: initState({
        cssTheme: 'default',
        autoAnalyzeBpm: true,
        autoAnalyzeGenres: false,
      }),
    });

    const backendService = {
      addSong: vi.fn(async () => song('1', { bpm: undefined })),
    } as unknown as BackendService;

    const autoAnalyzeBpmMock = vi.mocked(autoAnalyzeBpmForSong);
    autoAnalyzeBpmMock.mockClear();

    await processSongs([new File(['x'], 'a.mp3', { type: 'audio/mpeg' })], state, backendService);

    expect(autoAnalyzeBpmMock).toHaveBeenCalledTimes(1);
    expect(autoAnalyzeBpmMock.mock.calls[0]?.[0]).toBe(backendService);
    expect(autoAnalyzeBpmMock.mock.calls[0]?.[1]?.id).toBe('1');
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
