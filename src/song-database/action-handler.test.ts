import { describe, expect, it, vi } from 'vitest';

import { Context } from '../utils/context.ts';
import type { Song, SongMetadata, State, StateBase } from '../types.ts';
import type { BackendService, SongMetadataAttribute } from '../backend/backend.ts';
import { createSongDatabaseState } from './song-database-state.ts';
import { createSongDatabaseActionHandler } from './action-handler.ts';

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
    cssTheme: 'default',
  };

  return Context<StateBase>({ ...base, ...overrides }) as unknown as State;
}

function submitEvent(form: HTMLFormElement, submitter: HTMLButtonElement): SubmitEvent {
  return {
    preventDefault: () => undefined,
    target: form,
    submitter,
  } as unknown as SubmitEvent;
}

describe('actionHandler', () => {
  it('edit-tags updates dbState.db using saveUpdatedSongsFn', async () => {
    const state = createState();
    const dbState = createSongDatabaseState({
      db: [song('1', { title: 'a' }), song('2', { title: 'b' })],
    });

    const backendService = {
      getSongBpm: vi.fn(async () => 120),
    } as unknown as BackendService;

    const saveUpdatedSongsFn = vi.fn(async () => [song('x', { title: 'z' })]);
    const editId3TagsFn = vi.fn(
      async (
        _songs: Song[],
        _getSongBpm: (songId: string) => Promise<number | null>,
        _getSongGenres?: (songId: string) => Promise<string[] | null>,
        _notifier?: unknown
      ) => ({
        updatedTags: { title: 'new' },
      })
    );

    const handler = createSongDatabaseActionHandler({
      state,
      dbState,
      backendService,
      getCurrentGroupBy: () => [],
      refreshDb: vi.fn(async () => undefined),
      onRemoveSong: vi.fn(async () => undefined),
      addSongsToPlaylist: vi.fn(async () => undefined),
      saveUpdatedSongsFn,
      editId3TagsFn,
    });

    const form = document.createElement('form');
    const input = document.createElement('input');
    input.name = 'selected-song';
    input.value = '2';
    form.appendChild(input);

    const btn = document.createElement('button');
    btn.setAttribute('data-action', 'edit-tags');

    await handler(submitEvent(form, btn));

    expect(editId3TagsFn).toHaveBeenCalledTimes(1);
    expect(editId3TagsFn.mock.calls[0][0]).toEqual([song('2', { title: 'b' })]);
    expect(typeof editId3TagsFn.mock.calls[0][1]).toBe('function');
    expect(typeof editId3TagsFn.mock.calls[0][2]).toBe('function');
    expect(editId3TagsFn.mock.calls[0][3]).toBeUndefined();
    expect(saveUpdatedSongsFn).toHaveBeenCalledTimes(1);
    expect(dbState.db).toEqual([song('x', { title: 'z' })]);
  });

  it('group-by-option removes previous filter and sets state.groupBy', async () => {
    const state = createState({
      groupBy: [{ name: 'artists' as SongMetadataAttribute, selected: null, sortBy: 'valueAsec' }],
      dbFilters: { artists: 'Miles', other: 1 },
    });
    const dbState = createSongDatabaseState({ db: [] });

    const handler = createSongDatabaseActionHandler({
      state,
      dbState,
      backendService: {} as BackendService,
      getCurrentGroupBy: () => ['artists'],
      refreshDb: vi.fn(async () => undefined),
      onRemoveSong: vi.fn(async () => undefined),
      addSongsToPlaylist: vi.fn(async () => undefined),
    });

    const form = document.createElement('form');
    const btn = document.createElement('button');
    btn.setAttribute('data-action', 'group-by-option');
    btn.setAttribute('data-group-by', 'album');

    await handler(submitEvent(form, btn));

    expect(state.dbFilters).toEqual({ other: 1 });
    expect(state.groupBy[0].name).toBe('album');
  });

  it('group-by-option ctrl-click does not add secondary when primary has no selection', async () => {
    const state = createState({
      groupBy: [{ name: 'album' as SongMetadataAttribute, selected: null, sortBy: 'valueAsec' }],
      dbFilters: {},
    });
    const dbState = createSongDatabaseState({ db: [] });

    const handler = createSongDatabaseActionHandler({
      state,
      dbState,
      backendService: {} as BackendService,
      getCurrentGroupBy: () => ['album'],
      refreshDb: vi.fn(async () => undefined),
      onRemoveSong: vi.fn(async () => undefined),
      addSongsToPlaylist: vi.fn(async () => undefined),
    });

    const form = document.createElement('form');
    const btn = document.createElement('button');
    btn.setAttribute('data-action', 'group-by-option');
    btn.setAttribute('data-group-by', 'artists');
    btn.dataset.multi = '1';

    await handler(submitEvent(form, btn));

    expect(state.groupBy.map(g => g.name)).toEqual(['album']);
  });

  it('group-by-option ctrl-click adds secondary after primary selection', async () => {
    const state = createState({
      groupBy: [{ name: 'album' as SongMetadataAttribute, selected: null, sortBy: 'valueAsec' }],
      dbFilters: {},
    });
    const dbState = createSongDatabaseState({ db: [] });

    const handler = createSongDatabaseActionHandler({
      state,
      dbState,
      backendService: {} as BackendService,
      getCurrentGroupBy: () => ['album'],
      refreshDb: vi.fn(async () => undefined),
      onRemoveSong: vi.fn(async () => undefined),
      addSongsToPlaylist: vi.fn(async () => undefined),
    });

    const form = document.createElement('form');
    const btn = document.createElement('button');
    btn.setAttribute('data-action', 'group-by-option');
    btn.setAttribute('data-group-by', 'artists');
    btn.dataset.multi = '1';

    state.dbFilters = { album: 'Kind of Blue' };

    btn.dataset.multi = '1';
    await handler(submitEvent(form, btn));
    expect(state.groupBy.map(g => g.name)).toEqual(['album', 'artists']);
  });

  it('play-now enqueues next and emits next-song event', async () => {
    const state = createState();
    const dbState = createSongDatabaseState({ db: [song('1')] });

    const enqueueSongsNextFn = vi.fn(() => undefined);

    const handler = createSongDatabaseActionHandler({
      state,
      dbState,
      backendService: {} as BackendService,
      getCurrentGroupBy: () => [],
      refreshDb: vi.fn(async () => undefined),
      onRemoveSong: vi.fn(async () => undefined),
      addSongsToPlaylist: vi.fn(async () => undefined),
      enqueueSongsNextFn,
    });

    const form = document.createElement('form');
    const input = document.createElement('input');
    input.name = 'selected-song';
    input.value = '1';
    form.appendChild(input);

    const btn = document.createElement('button');
    btn.setAttribute('data-action', 'play-now');

    await handler(submitEvent(form, btn));

    expect(enqueueSongsNextFn).toHaveBeenCalledTimes(1);
    expect(state.lastEvent?.type).toBe('next-song');
  });
});
