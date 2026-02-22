import { describe, expect, it, vi } from 'vitest';

import { Context } from '../utils/context.ts';
import type { BackendService, SongGroupsResponseItem, SongGroupsQueryItem } from '../backend/backend.ts';
import type { State, StateBase } from '../types.ts';
import { createSongDatabaseState } from './song-database-state.ts';
import { attachSongDatabaseStateListeners } from './state-listener.ts';

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

describe('stateListener', () => {
  it('rerenders table body when db or artistFilter changes', () => {
    const state = createState();
    const dbState = createSongDatabaseState();

    const rerenderTableBody = vi.fn();

    attachSongDatabaseStateListeners({
      state,
      dbState,
      backendService: { getSongsGroups: vi.fn(async () => ({ groups: [] })) } as unknown as BackendService,
      artistFilterInput: document.createElement('input'),
      refreshDb: vi.fn(async () => undefined),
      rerenderTableBody,
      onSortByDropdownChange: vi.fn(),
      onGroupByDropdownChange: vi.fn(),
      onGroupsChanged: vi.fn(),
      onPlaylistsChanged: vi.fn(),
      getCurrentGroupBy: () => [],
    });

    dbState.db = [];
    dbState.artistFilter = 'x';

    expect(rerenderTableBody).toHaveBeenCalledTimes(2);
  });

  it('refreshes on dbFilters change', () => {
    const state = createState();
    const dbState = createSongDatabaseState();

    const refreshDb = vi.fn(async () => undefined);

    attachSongDatabaseStateListeners({
      state,
      dbState,
      backendService: { getSongsGroups: vi.fn(async () => ({ groups: [] })) } as unknown as BackendService,
      artistFilterInput: document.createElement('input'),
      refreshDb,
      rerenderTableBody: vi.fn(),
      onSortByDropdownChange: vi.fn(),
      onGroupByDropdownChange: vi.fn(),
      onGroupsChanged: vi.fn(),
      onPlaylistsChanged: vi.fn(),
      getCurrentGroupBy: () => [],
    });

    state.dbFilters = { a: 1 };

    expect(refreshDb).toHaveBeenCalledTimes(1);
  });

  it('updates groups via backend when groupBy changes and notifies callbacks', async () => {
    const state = createState();
    const dbState = createSongDatabaseState();

    const groups: SongGroupsResponseItem[] = [
      {
        name: 'album',
        selected: null,
        sortBy: 'valueAsec',
        items: [],
      },
    ];

    const backendService = {
      getSongsGroups: vi.fn(async () => ({ groups })),
    } as unknown as BackendService;

    const onGroupsChanged = vi.fn();
    const onGroupByDropdownChange = vi.fn();

    attachSongDatabaseStateListeners({
      state,
      dbState,
      backendService,
      artistFilterInput: document.createElement('input'),
      refreshDb: vi.fn(async () => undefined),
      rerenderTableBody: vi.fn(),
      onSortByDropdownChange: vi.fn(),
      onGroupByDropdownChange,
      onGroupsChanged,
      onPlaylistsChanged: vi.fn(),
      getCurrentGroupBy: () => ['album'],
    });

    const groupBy: SongGroupsQueryItem[] = [{ name: 'album', selected: null, sortBy: 'valueAsec' }];
    state.groupBy = groupBy;

    await new Promise(r => setTimeout(r, 0));

    expect(onGroupByDropdownChange).toHaveBeenCalledWith(['album']);
    expect(backendService.getSongsGroups).toHaveBeenCalledTimes(1);
    expect(dbState.groups).toHaveLength(1);
    expect(onGroupsChanged).toHaveBeenCalledTimes(1);
  });

  it('refreshes on file-loaded event', async () => {
    const state = createState();
    const dbState = createSongDatabaseState();

    const refreshDb = vi.fn(async () => undefined);

    attachSongDatabaseStateListeners({
      state,
      dbState,
      backendService: { getSongsGroups: vi.fn(async () => ({ groups: [] })) } as unknown as BackendService,
      artistFilterInput: document.createElement('input'),
      refreshDb,
      rerenderTableBody: vi.fn(),
      onSortByDropdownChange: vi.fn(),
      onGroupByDropdownChange: vi.fn(),
      onGroupsChanged: vi.fn(),
      onPlaylistsChanged: vi.fn(),
      getCurrentGroupBy: () => [],
    });

    state.lastEvent = new CustomEvent('file-loaded');

    await new Promise(r => setTimeout(r, 0));

    expect(refreshDb).toHaveBeenCalledTimes(1);
  });
});
