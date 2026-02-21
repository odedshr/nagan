import { BackendService, GetSongsQuery, SongGroupSortBy, SongMetadataAttribute } from '../backend/backend.ts';
import { enqueueSongs, enqueueSongsNext } from '../queue/queue-manager.ts';
import { FileDropEvent, Playlist, Song, SongMetadata, State, TauriFile } from '../types.ts';
import confirm from '../ui-components/confirm/confirm.ts';
import AddToPlaylist from './AddToPlaylist.tsx';
import GroupBy from './GroupBy.tsx';
import editId3Tags from './id3-tag-editor/Id3TagEditor.ts';
import SongDatabaseUI from './SongDatabase.tsx';
import SongDatabaseTableBody from './SongDatabaseTableBody.tsx';
import selectFile from './files/select-file.ts';
import Groups from './Groups.tsx';
import replaceWith from '../utils/replaceWith.ts';
import { createSongDatabaseState } from './song-database.state.ts';

async function browseFile(state: State, backendService: BackendService) {
  ((await selectFile()) || []).forEach(async file => {
    try {
      await backendService.addSong(file.name);
      state.lastEvent = new CustomEvent('file-loaded', { detail: { file } });
      refreshSongs(state, backendService);
    } catch (error) {
      state.lastEvent = new CustomEvent('notification', { detail: { type: 'error', message: error } });
      return;
    }
  });
}

async function refreshSongs(state: State, backendService: BackendService) {
  try {
    const query: GetSongsQuery = { filters: state.dbFilters };
    const response = await backendService.getSongs(query);
    return response.songs;
  } catch (error) {
    console.error('Error fetching songs:', error);
  }

  return [];
}

async function addSongsToPlaylist(
  playlistId: string | null,
  songs: Song[],
  backendService: BackendService,
  state: State
) {
  if (playlistId) {
    if (playlistId === 'queue') {
      return enqueueSongs(state, songs);
    }

    await Promise.all(
      songs.map(async song => {
        try {
          await backendService.addSongToPlaylist({ playlistId, songId: song.id });
        } catch (error) {
          console.error(`❌ Failed to add song ${song.id} to playlist ${playlistId}:`, error);
        }
      })
    );
    if (state.currentPlaylistId === playlistId) {
      state.playlistSongs = await backendService.getPlaylistSongs({ playlistId: state.currentPlaylistId });
    }
  }
}

async function saveUpdatedSongs(
  backendService: BackendService,
  dbCopy: Song[],
  songsToUpdate: Song[],
  metadata: Partial<SongMetadata>
): Promise<Song[]> {
  switch (songsToUpdate.length) {
    case 0:
      break;
    case 1:
      const updatedSong = await backendService.updateSong({
        id: songsToUpdate[0].id,
        metadata,
        update_id3: true,
      });

      if (updatedSong) {
        return dbCopy.map(s => (s.id === updatedSong.id ? updatedSong : s));
      }

      break;
    default:
      await backendService.bulkUpdateSongs({
        ids: songsToUpdate.map(s => s.id),
        updates: metadata,
        update_id3: true,
      });
      const updateSongById: { [id: string]: Song } = {};
      songsToUpdate.forEach(s => (updateSongById[s.id] = { ...s, metadata: { ...s.metadata, ...metadata } } as Song));

      return dbCopy.map(s => updateSongById[s.id] || s);
  }
  return dbCopy;
}

const allColumns = ['select', 'artwork', 'title', 'artists', 'album', 'genre', 'year', 'bpm', 'duration', 'comment'];

export default function SongDatabase(state: State, backendService: BackendService) {
  const dbState = createSongDatabaseState();

  const refresh = async () => {
    dbState.db = await refreshSongs(state, backendService);
  };

  state.addListener('lastEvent', async (event?: CustomEvent) => {
    if (event) {
      switch (event.type) {
        case 'file-loaded':
          // const { file, metadata } = (event as FileLoadedEvent).detail;
          // const song = await backendService.addSong(file.name, metadata);
          refresh();
          break;
        case 'files-dropped':
          const files = (event as FileDropEvent).detail.files as File[];
          files.forEach(async (file: File) => {
            try {
              console.log(`➕ Adding song from file: ${file.name}, ${(file as TauriFile).path}`);
              // const song = await backendService.addSong(file.path);
              // console.log(`✅ Added song: ${song.title} by ${song.artist}`);
            } catch (error) {
              console.error(`❌ Failed to add song from file ${file.name}:`, error);
            }
          });
          break;
      }
    }
  });

  const getColumns = () =>
    allColumns.filter(column => !dbState.groups.map(group => group.name as string).includes(column));

  const getVisibleSongs = () => {
    const filter = dbState.artistFilter.trim().toLowerCase();
    if (!filter) {
      return dbState.db;
    }

    return dbState.db.filter(song => {
      const artists = song.metadata.artists;
      const artistsText = Array.isArray(artists) ? artists.join(', ') : artists;
      return artistsText.toLowerCase().includes(filter);
    });
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
        refreshSongs(state, backendService);
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
  let songDatabaseTableBody = SongDatabaseTableBody(
    getVisibleSongs(),
    [] as string[],
    columns,
    onToggleSong,
    onSongSelected
  );
  let groups = Groups(dbState.groups);
  const elm = SongDatabaseUI(groups, columns, addToPlaylist, groupByDropdown, songDatabaseTableBody, selectAll);

  const onFormSubmitted = async (e: SubmitEvent) => {
    e.preventDefault();
    const songIds = new FormData(e.target as HTMLFormElement).getAll('selected-song');
    const songs = songIds.map(songId => dbState.db.find(s => s.id === songId)).filter(s => s !== undefined) as Song[];
    switch ((e.submitter as HTMLButtonElement).getAttribute('data-action')) {
      case 'add-songs':
        return browseFile(state, backendService);
      case 'edit-tags':
        const tagsToUpdate = await editId3Tags(songs);
        if (tagsToUpdate) {
          const dbCopy = await saveUpdatedSongs(backendService, [...dbState.db], songs, tagsToUpdate);
          dbState.db = dbCopy;
        }
        break;
      case 'play-now':
        enqueueSongsNext(state, songs);
        state.lastEvent = new CustomEvent('next-song');
        break;
      case 'delete':
        songs.forEach(async song => await onRemoveSong(song));
        break;
      case 'add-to-playlist-option':
        return addSongsToPlaylist(
          (e.submitter as HTMLButtonElement).getAttribute('data-playlist-id'),
          songs,
          backendService,
          state
        );
      case 'group-by-option':
        // remove previous group by filter if exists
        const previousGroupBy = getCurrentGroupBy();
        if (previousGroupBy) {
          const { [previousGroupBy]: _, ...restFilters } = state.dbFilters;
          state.dbFilters = restFilters;
        }
        const groupByValue = (e.submitter as HTMLButtonElement).getAttribute('data-group-by') as SongMetadataAttribute;
        state.groupBy = groupByValue ? [{ name: groupByValue, selected: null, sortBy: 'valueAsec' }] : [];

        return;
      case 'group-sort-by':
        const sortBy = (e.submitter as HTMLButtonElement).getAttribute('data-sort-by') as SongGroupSortBy;
        const sortGroupName = (e.submitter as HTMLButtonElement).getAttribute('data-group') as SongMetadataAttribute;
        if (sortGroupName && sortBy) {
          state.groupBy = state.groupBy.map(group => (group.name === sortGroupName ? { ...group, sortBy } : group));
        }
        return;
      case 'group-select':
        const button = e.submitter as HTMLButtonElement;
        const itemName = button.getAttribute('title');
        const groupName = button.getAttribute('data-group');
        if (groupName && itemName) {
          state.dbFilters = { ...state.dbFilters, [groupName]: itemName };
        }
        return;
      default:
        console.warn('Unknown action:', (e.submitter as HTMLButtonElement).getAttribute('data-action'));
        break;
    }
    return false;
  };
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
    songDatabaseTableBody = replaceWith(songDatabaseTableBody, newContent) as HTMLTableSectionElement;
  };

  dbState.addListener('db', rerenderTableBody);
  dbState.addListener('artistFilter', rerenderTableBody);

  state.addListener('dbFilters', () => void refresh());

  state.addListener('groupBy', async () => {
    groupByDropdown = replaceWith(groupByDropdown, GroupBy(getCurrentGroupBy())) as HTMLDivElement;
    const response =
      state.groupBy.length > 0 ? await backendService.getSongsGroups({ groups: state.groupBy }) : { groups: [] };
    dbState.groups = response.groups;
  });

  dbState.addListener('groups', () => {
    groups = replaceWith(groups, Groups(dbState.groups)) as HTMLDivElement;
  });

  state.addListener('playlists', (playlists: Playlist[]) => {
    addToPlaylist = replaceWith(addToPlaylist, AddToPlaylist(playlists)) as HTMLDivElement;
  });

  const artistFilterInput = elm.querySelector('input[name="artist-filter"]') as HTMLInputElement;
  dbState.bidi('artistFilter', artistFilterInput, 'value', 'input');

  void refresh();

  return elm;
}
