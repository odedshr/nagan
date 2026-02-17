import { BackendService, GetSongsQuery } from '../backend/backend.ts';
import { enqueueSongs, enqueueSongsNext } from '../queue/queue-manager.ts';
import { FileDropEvent, Playlist, Song, SongMetadata, State, TauriFile } from '../types.ts';
import confirm from '../ui-components/confirm/confirm.ts';
import AddToPlaylist from './AddToPlaylist.tsx';
import editId3Tags from './id3-tag-editor/Id3TagEditor.ts';
import SongDatabaseUI from './SongDatabase.tsx';
import SongDatabaseTableBody from './SongDatabaseTableBody.tsx';
import selectFile from './files/select-file.ts';
import throttle from '../utils/throttle.ts';

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
    const query: GetSongsQuery = {};
    if (state.dbFilterArtist) {
      query.filters = { artists: state.dbFilterArtist };
    }

    const response = await backendService.getSongs(query);
    state.db = response.songs;
  } catch (error) {
    console.error('Error fetching songs:', error);
  }
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

export default function SongDatabase(state: State, backendService: BackendService) {
  const refresh = () => refreshSongs(state, backendService);

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

  const columns = ['select', 'artwork', 'title', 'artists', 'album', 'genre', 'year', 'bpm', 'duration', 'comment'];
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
  let songDatabaseTableBody = SongDatabaseTableBody(state.db, [] as string[], columns, onToggleSong, onSongSelected);
  const elm = SongDatabaseUI(columns, addToPlaylist, songDatabaseTableBody, selectAll);

  const onFormSubmitted = async (e: SubmitEvent) => {
    e.preventDefault();
    const songIds = new FormData(e.target as HTMLFormElement).getAll('selected-song');
    const songs = songIds.map(songId => state.db.find(s => s.id === songId)).filter(s => s !== undefined) as Song[];
    switch ((e.submitter as HTMLButtonElement).getAttribute('data-action')) {
      case 'add-songs':
        return browseFile(state, backendService);
      case 'edit-tags':
        const tagsToUpdate = await editId3Tags(songs);
        if (tagsToUpdate) {
          const dbCopy = await saveUpdatedSongs(backendService, [...state.db], songs, tagsToUpdate);
          state.db = dbCopy;
        }
        break;
      case 'add-to-playlist':
        // ideally this should be css-based only, but for now...
        e.submitter?.setAttribute('data-show', 'true');
        document.addEventListener('click', () => e.submitter?.removeAttribute('data-show'), { once: true });
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
      default:
        break;
    }
    return false;
  };
  elm.onsubmit = onFormSubmitted;

  state.addListener('db', () => {
    const selectedSongIds = new Set(Array.from(selectedSongs).map(s => s.id));
    const newContent = SongDatabaseTableBody(
      state.db,
      Array.from(selectedSongIds),
      columns,
      onToggleSong,
      onSongSelected
    );
    newContent.onsubmit = onFormSubmitted;
    songDatabaseTableBody.replaceWith(newContent);
    songDatabaseTableBody = newContent;
  });

  state.addListener('playlists', (playlists: Playlist[]) => {
    const newAddToPlaylist = AddToPlaylist(playlists);
    addToPlaylist.replaceWith(newAddToPlaylist);
    addToPlaylist = newAddToPlaylist;
  });

  const artistFilterInput = elm.querySelector('input[name="artist-filter"]') as HTMLInputElement;
  state.bidi('dbFilterArtist', artistFilterInput, 'value', 'input');
  state.addListener('dbFilterArtist', throttle(refresh, 1000));

  refreshSongs(state, backendService);

  return elm;
}
