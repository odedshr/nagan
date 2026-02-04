import { BackendService } from '../backend/backend.ts';
import { enqueueSongs, enqueueSongsNext } from '../queue/queue-manager.ts';
import { FileDropEvent, Playlist, Song, State, TauriFile } from '../types.ts';
import { showConfirm } from '../ui-components/confirm/confirm.ts';
import AddToPlaylist from './AddToPlaylist.tsx';
import SongDatabaseUI from './SongDatabase.tsx';
import selectFile from './files/select-file.ts';

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
    const response = await backendService.getSongs({});
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
    songs.forEach(async song => {
      try {
        await backendService.addSongToPlaylist({ playlistId, songId: song.id });
      } catch (error) {
        console.error(`❌ Failed to add song ${song.id} to playlist ${playlistId}:`, error);
      }
    });
    if (state.currentPlaylistId === playlistId) {
      state.playlistSongs = await backendService.getPlaylistSongs({ playlistId: state.currentPlaylistId });
    }
  }
}

export default function SongDatabase(state: State, backendService: BackendService) {
  state.addListener('lastEvent', async (event?: CustomEvent) => {
    if (event) {
      switch (event.type) {
        case 'file-loaded':
          // const { file, metadata } = (event as FileLoadedEvent).detail;
          // const song = await backendService.addSong(file.name, metadata);
          refreshSongs(state, backendService);
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
    if (
      await showConfirm(`Are you sure you want to delete the song: ${song.filename}? This action cannot be undone.`)
    ) {
      const success = await backendService.deleteSong(song.id);
      if (success) {
        refreshSongs(state, backendService);
      } else {
        console.error(`❌ Failed to delete song: ${song.id}`);
      }
    }
  };

  let addToPlaylist = AddToPlaylist(state.playlists);
  const elm = SongDatabaseUI(state.db, addToPlaylist, onSongSelected);
  const onFormSubmitted = async (e: SubmitEvent) => {
    e.preventDefault();
    const songIds = new FormData(e.target as HTMLFormElement).getAll('selected-song');
    const songs = songIds.map(songId => state.db.find(s => s.id === songId)).filter(s => s !== undefined) as Song[];
    switch ((e.submitter as HTMLButtonElement).getAttribute('data-action')) {
      case 'add-songs':
        browseFile(state, backendService);
        break;
      case 'edit-tags':
        // Handle edit tags
        break;
      case 'add-to-queue':
        enqueueSongs(state, songs);
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
    const newForm = SongDatabaseUI(state.db, addToPlaylist, onSongSelected);
    newForm.onsubmit = onFormSubmitted;
    elm.replaceWith(newForm);
  });

  state.addListener('playlists', (playlists: Playlist[]) => {
    const newAddToPlaylist = AddToPlaylist(playlists);
    addToPlaylist.replaceWith(newAddToPlaylist);
    addToPlaylist = newAddToPlaylist;
  });

  refreshSongs(state, backendService);

  return elm;
}
