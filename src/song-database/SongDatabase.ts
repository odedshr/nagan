import { BackendService, SongMetadataAttribute } from '../backend/backend.ts';
import { enqueueSongs, enqueueSongsNext } from '../queue/queue-manager.ts';
import { Playlist, Song, State, TauriFile } from '../types.ts';
import confirm from '../ui-components/confirm/confirm.ts';
import AddToPlaylist from './AddToPlaylist.tsx';
import GroupBy from './groups/GroupBy.tsx';
import editId3Tags from './id3-tag-editor/Id3TagEditor.ts';
import SongDatabaseUI from './SongDatabase.tsx';
import SongDatabaseTableHeader from './SongDatabaseTableHeader.tsx';
import SongDatabaseTableBody from './SongDatabaseTableBody.tsx';
import Groups from './groups/Groups.tsx';
import replaceWith from '../utils/replaceWith.ts';
import { createSongDatabaseState } from './song-database.state.ts';
import { addSongsToPlaylist as addSongsToPlaylistImpl, browseFile as browseFileImpl } from './addSongs.ts';
import { createSongDatabaseActionHandler } from './actionHandler.ts';
import { attachSongDatabaseStateListeners } from './stateListener.ts';
import { fetchSongs, filterSongsByArtist } from './songQueries.ts';

const allColumns = ['select', 'artwork', 'title', 'artists', 'album', 'genre', 'year', 'bpm', 'duration', 'comment'];

export default function SongDatabase(state: State, backendService: BackendService) {
  const dbState = createSongDatabaseState();

  const refreshDb = async () => {
    dbState.db = await fetchSongs(state, backendService);
  };

  const getColumns = () =>
    allColumns.filter(column => !dbState.groups.map(group => group.name as string).includes(column));

  const getVisibleSongs = () => {
    return filterSongsByArtist(dbState.db, dbState.artistFilter);
  };

  const getCurrentGroupBy = (): SongMetadataAttribute | undefined => {
    const first = state.groupBy[0];
    return first?.name as SongMetadataAttribute | undefined;
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
  const selectAll = (e: Event) => {
    const checked = (e.target as HTMLInputElement).checked;
    (document.querySelectorAll('.select-song-checkbox') as NodeListOf<HTMLInputElement>).forEach(checkbox => {
      checkbox.checked = checked;
      checkbox.dispatchEvent(new Event('change'));
    });
  };

  const onToggleSong = (song: Song, checked: boolean) => {
    if (checked) {
      selectedSongs.add(song);
    } else {
      selectedSongs.delete(song);
    }

    const anySongsSelected = selectedSongs.size > 0;
    document
      .querySelectorAll('button[data-target="song"]')
      .forEach(btn => ((btn as HTMLButtonElement).disabled = !anySongsSelected));
  };

  let addToPlaylist = AddToPlaylist(state.playlists);
  let groupByDropdown = GroupBy(getCurrentGroupBy());
  const columns = getColumns();
  let tableBody = SongDatabaseTableBody(getVisibleSongs(), [] as string[], columns, onToggleSong, onSongSelected);
  let tableHeader = SongDatabaseTableHeader(columns, selectAll);
  let groups = Groups(dbState.groups);
  const elm = SongDatabaseUI(groups, columns, addToPlaylist, groupByDropdown, tableHeader, tableBody);

  const addSongsToPlaylist = async (playlistId: string | null, songs: Song[]) => {
    return addSongsToPlaylistImpl({ playlistId, songs, backendService, state, enqueueSongsFn: enqueueSongs });
  };

  const onFormSubmitted = createSongDatabaseActionHandler({
    state,
    dbState,
    backendService,
    getCurrentGroupBy,
    onRemoveSong,
    addSongsToPlaylist,
    refreshDb,
    browseFileFn: browseFileImpl,
    editId3TagsFn: editId3Tags,
    enqueueSongsNextFn: enqueueSongsNext,
  });

  elm.onsubmit = onFormSubmitted;

  const rerenderTableBody = () => {
    const selectedSongIds = new Set(Array.from(selectedSongs).map(s => s.id));
    const newContent = SongDatabaseTableBody(
      getVisibleSongs(),
      Array.from(selectedSongIds),
      getColumns(),
      onToggleSong,
      onSongSelected
    );
    newContent.onsubmit = onFormSubmitted;
    tableBody = replaceWith(tableBody, newContent) as HTMLTableSectionElement;
    tableHeader = replaceWith(tableHeader, SongDatabaseTableHeader(getColumns(), selectAll)) as HTMLTableSectionElement;
  };

  const artistFilterInput = elm.querySelector('input[name="artist-filter"]') as HTMLInputElement;

  attachSongDatabaseStateListeners({
    state,
    dbState,
    backendService,
    artistFilterInput,
    refreshDb,
    rerenderTableBody,
    getCurrentGroupBy,
    onGroupByDropdownChange: current => {
      groupByDropdown = replaceWith(groupByDropdown, GroupBy(current)) as HTMLDivElement;
    },
    onGroupsChanged: _ => {
      groups = replaceWith(groups, Groups(dbState.groups)) as HTMLDivElement;
    },
    onPlaylistsChanged: (playlists: Playlist[]) => {
      addToPlaylist = replaceWith(addToPlaylist, AddToPlaylist(playlists)) as HTMLDivElement;
    },
    onFilesDropped: (files: File[]) => {
      files.forEach(async (file: File) => {
        try {
          console.log(`➕ Adding song from file: ${file.name}, ${(file as TauriFile).path}`);
        } catch (error) {
          console.error(`❌ Failed to add song from file ${file.name}:`, error);
        }
      });
    },
  });

  void refreshDb();

  return elm;
}
