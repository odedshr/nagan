import { BackendService, SongMetadataAttribute } from '../backend/backend.ts';
import { enqueueSongs, enqueueSongsNext } from '../queue/queue-manager.ts';
import { Playlist, Song, State, DbSortItem } from '../types.ts';
import confirm from '../ui-components/confirm/confirm.ts';
import AddToPlaylist from './AddToPlaylist.tsx';
import GroupBy from './groups/GroupBy.tsx';
import SortBy from './sort/SortBy.tsx';
import editId3Tags from './id3-tag-editor/id3-tag-editor.ts';
import SongDatabaseUI from './SongDatabase.tsx';
import SongDatabaseTableHeader from './SongDatabaseTableHeader.tsx';
import SongDatabaseTableBody from './SongDatabaseTableBody.tsx';
import SongDatabaseTableFooter from './SongDatabaseTableFooter.tsx';
import Groups from './groups/Groups.tsx';
import replaceWith from '../utils/replace-with.ts';
import { createSongDatabaseState } from './song-database-state.ts';
import { addSongsToPlaylist as addSongsToPlaylistImpl } from './add-songs-to-playlist.ts';
import { createSongDatabaseActionHandler } from './action-handler.ts';
import { attachSongDatabaseStateListeners } from './state-listener.ts';
import { fetchSongs } from './song-queries.ts';
import { createLastEventNotifier } from '../ui-components/notification/notifier.ts';
import processSongs from './process-songs.ts';
import getOnEvent from '../utils/on-event.ts';
import { getSongsGenres } from './analyze-genres.ts';
import { getSongsBPMs } from './analyze-bpm.ts';

// const allColumns = ['select', 'artwork', 'title', 'artists', 'album', 'genre', 'year', 'bpm', 'duration', 'comment'];

export default function SongDatabase(state: State, backendService: BackendService) {
  const dbState = createSongDatabaseState();

  const notifier = createLastEventNotifier(
    event => {
      state.lastEvent = event;
    },
    { logInDev: true }
  );

  const getHeader = () =>
    SongDatabaseTableHeader({
      columns: getColumns(),
      sortBy: state.dbQuery.sort,
      selectAll,
      onReorder: onColumnOrderChanged,
      onChangeSort,
    });

  const getBody = () => {
    const selectedSongIds = new Set(Array.from(selectedSongs).map(s => s.id));
    const newContent = SongDatabaseTableBody(
      getVisibleSongs(),
      Array.from(selectedSongIds),
      getColumns(),
      onToggleSong,
      onSongSelected,
      onSongCheckboxClick
    );
    newContent.onsubmit = onFormSubmitted;
    return newContent;
  };

  const getFooter = () =>
    SongDatabaseTableFooter({
      columns: getColumns(),
      totalSongs: dbState.totalSongs,
      selectedSongs: selectedSongs.size,
      pageNumber: state.dbQuery.pageNumber,
      pageSize: state.dbQuery.pageSize,
    });

  const refreshHeader = () => {
    header = replaceWith(header, getHeader()) as HTMLTableSectionElement;
  };

  const refreshBody = () => {
    tableBody = replaceWith(tableBody, getBody()) as HTMLTableSectionElement;
  };

  const refreshFooter = () => {
    footer = replaceWith(footer, getFooter()) as HTMLTableSectionElement;
  };

  const refreshTable = () => {
    refreshHeader();
    refreshBody();
    refreshFooter();
  };

  const refreshDb = async () => {
    const { songs, total } = await fetchSongs(state, backendService);
    // update totalSongs first because updating db will trigger a re-render which relies on totalSongs to determine pagination
    dbState.totalSongs = total;
    dbState.db = songs;
  };

  const getColumns = () =>
    state.dbQuery.columns.filter(column => !dbState.groups.map(group => group.name as string).includes(column));

  const getVisibleSongs = () => dbState.db;

  const getCurrentGroupBy = (): SongMetadataAttribute[] => {
    return state.dbQuery.groupBy.map(g => g.name as SongMetadataAttribute);
  };

  const onSongSelected = (song: Song) => {
    state.currentTrack = song;
  };

  const onRemoveSong = async (song: Song) => {
    if (await confirm(`Are you sure you want to delete the song: ${song.filename}? This action cannot be undone.`)) {
      const success = await backendService.deleteSong(song.id);
      if (success) {
        void refreshDb();
      } else {
        console.error(`❌ Failed to delete song: ${song.id}`);
      }
    }
  };

  const selectedSongs = new Set<Song>();
  let selectionAnchorSongId: string | null = null;

  const onSongCheckboxClick = (song: Song, checked: boolean, shiftKey: boolean, visibleSongs: Song[]) => {
    if (shiftKey && selectionAnchorSongId) {
      const visibleSongIds = visibleSongs.map(s => s.id);
      const anchorIndex = visibleSongIds.indexOf(selectionAnchorSongId);
      const currentIndex = visibleSongIds.indexOf(song.id);

      if (anchorIndex > -1 && currentIndex > -1) {
        const [from, to] = anchorIndex <= currentIndex ? [anchorIndex, currentIndex] : [currentIndex, anchorIndex];
        tableBody.dispatchEvent(new CustomEvent('select-multiple-songs', { detail: { from, to, checked } }));
      }
    }

    selectionAnchorSongId = song.id;
  };

  const selectAll = (e: PointerEvent) => {
    const modifierPressed = e.metaKey || e.ctrlKey;
    const checked = !modifierPressed ? (e.target as HTMLInputElement).checked : undefined;
    tableBody.dispatchEvent(
      new CustomEvent('select-multiple-songs', { detail: { from: 0, to: dbState.db.length - 1, checked } })
    );
  };

  const onColumnOrderChanged = (visibleColumns: string[]) => {
    const visibleSet = new Set(visibleColumns);
    const oldColumns = state.dbQuery.columns;

    const visibleOld = oldColumns.filter(c => visibleSet.has(c));
    if (visibleOld.length !== visibleColumns.length) {
      console.warn('Ignoring column reorder due to mismatch', { visibleOld, visibleColumns });
      return;
    }

    let visibleIndex = 0;
    state.dbQuery.columns = oldColumns.map(c => (visibleSet.has(c) ? visibleColumns[visibleIndex++] : c));
    refreshTable();
  };

  const onChangeSort = (key: DbSortItem['key']) => {
    const oldSort = state.dbQuery.sort;
    const existing = oldSort.find(s => s.key === key);
    let newSort: DbSortItem[];
    if (existing) {
      const toggled: DbSortItem = { ...existing, direction: existing.direction === 'asc' ? 'desc' : 'asc' };
      newSort = oldSort.map(s => (s.key === key ? toggled : s));
    } else {
      newSort = [{ key, direction: 'asc' }, ...oldSort.slice(0, 2)]; // Limit to 3 sort keys
    }

    state.dbQuery.sort = newSort; // this will trigger dbState to recompute the sorted songs and re-render
  };

  const onToggleSong = (song: Song, checked: boolean) => {
    if (checked) {
      selectedSongs.add(song);
    } else {
      selectedSongs.delete(song);
    }

    const anySongsSelected = selectedSongs.size > 0;
    tableBody
      .querySelectorAll('button[data-target="song"]')
      .forEach(btn => ((btn as HTMLButtonElement).disabled = !anySongsSelected));

    refreshFooter();
  };

  let addToPlaylist = AddToPlaylist(state.playlists);
  let sortByDropdown = SortBy(state.dbQuery.sort);
  let groupByDropdown = GroupBy(getCurrentGroupBy());
  const columns = getColumns();
  let tableBody = SongDatabaseTableBody(
    getVisibleSongs(),
    [] as string[],
    columns,
    onToggleSong,
    onSongSelected,
    onSongCheckboxClick
  );
  let header = SongDatabaseTableHeader({
    columns,
    sortBy: state.dbQuery.sort,
    selectAll,
    onReorder: onColumnOrderChanged,
    onChangeSort,
  });
  let footer = getFooter();
  let groups = Groups(dbState.groups);
  const elm = SongDatabaseUI({
    groups,
    columns,
    addToPlaylist,
    sortByDropdown,
    groupByDropdown,
    header,
    body: tableBody,
    footer,
  });

  const addSongsToPlaylist = async (playlistId: string | null, songs: Song[]) => {
    return addSongsToPlaylistImpl({ playlistId, songs, backendService, state, enqueueSongsFn: enqueueSongs });
  };

  const onFormSubmitted = createSongDatabaseActionHandler({
    state,
    dbState,
    backendService,
    notifier,
    getCurrentGroupBy,
    onRemoveSong,
    addSongsToPlaylist,
    editId3TagsFn: editId3Tags,
    enqueueSongsNextFn: enqueueSongsNext,
  });

  elm.onsubmit = onFormSubmitted;

  attachSongDatabaseStateListeners({
    state,
    dbState,
    backendService,
    refreshDb,
    refreshTable,
    getCurrentGroupBy,
    onSortByDropdownChange: current => {
      sortByDropdown = replaceWith(sortByDropdown, SortBy(current)) as HTMLDivElement;
    },
    onGroupByDropdownChange: current => {
      groupByDropdown = replaceWith(groupByDropdown, GroupBy(current)) as HTMLDivElement;
    },
    onGroupsChanged: _ => {
      groups = replaceWith(groups, Groups(dbState.groups)) as HTMLDivElement;
    },
    onPlaylistsChanged: (playlists: Playlist[]) => {
      addToPlaylist = replaceWith(addToPlaylist, AddToPlaylist(playlists)) as HTMLDivElement;
    },
    onFilesDropped: async (files: File[]) => {
      console.log(files);
      await processSongs({
        files,
        onEvent: getOnEvent(state),
        addSong: backendService.addSong,
        updateSong: backendService.updateSong,
        analyzeGenres: state.preferences.autoAnalyzeGenres ? (songs: Song[]) => getSongsGenres(songs) : undefined,
        analyzeBpm: state.preferences.autoAnalyzeBpm
          ? (songs: Song[]) => getSongsBPMs(songs, backendService.getSongBpm)
          : undefined,
      });
      await refreshDb();
    },
  });

  void refreshDb();

  return elm;
}
