import { QueueItem, Song } from './../types';
import prompt from '../ui-components/prompt/prompt.ts';
import confirm from '../ui-components/confirm/confirm.ts';
import { State, Playlist } from '../types.ts';
import PlaylistList from './PlaylistList.tsx';
import PlaylistUi from './PlaylistManager.tsx';
import PlaylistEditor from './PlaylistEditor.tsx';
import PlaylistSongs from './PlaylistSongs.tsx';
import { BackendService } from '../backend/backend.ts';
import { shuffleQueue, sortQueueByColumn } from '../queue/queue-manager.ts';
import replaceWith from '../utils/replace-with.ts';

async function refreshPlaylists(state: State, backendService: BackendService) {
  try {
    state.playlists = await backendService.getPlaylists({});
  } catch (error) {
    console.error('Error fetching playlists:', error);
  }
}

function songListToQueueItems(songs: Song[]): QueueItem[] {
  return songs.map(song => ({ type: 'song', song }) as QueueItem);
}

export default function PlaylistManager(state: State, backendService: BackendService) {
  const addPlaylist = async () => {
    const playlistName = await prompt('Enter playlist name:');
    if (playlistName) {
      try {
        await backendService.createPlaylist(playlistName);
        refreshPlaylists(state, backendService);
      } catch (error) {
        console.error('Error creating playlist:', error);
      }
    }
  };

  const onPlaylistSelected = (playlist: Playlist | null) => {
    state.currentPlaylistId = playlist ? playlist.id : null;
  };

  const onPlaylistDeleted = async (playlist: Playlist) => {
    if (await confirm(`Are you sure you want to delete the playlist "${playlist.name}"?`, 'Delete', 'Cancel')) {
      try {
        await backendService.deletePlaylist(playlist.id);
        refreshPlaylists(state, backendService);
      } catch (error) {
        console.error('Error deleting playlist:', error);
      }
    }
  };

  const onSongSelected = (song: Song) => {
    state.currentTrack = song;
  };

  const removeSong = async (position: number) => {
    if (!state.currentPlaylistId) {
      // remove from queue
      state.queue = state.queue.filter((_, i) => i !== position);
      return;
    } else {
      // Playlist song positions are 0-based in the DB.
      await backendService.removeSongFromPlaylist({ playlistId: state.currentPlaylistId!, position });
      state.playlistSongs = await backendService.getPlaylistSongs({ playlistId: state.currentPlaylistId! });
    }
  };

  const onReorder = async (songs: QueueItem[]) => {
    if (!state.currentPlaylistId) {
      // reorder queue
      state.queue = songs;
      return;
    }

    const songIds = songs.map(s => (s.type === 'song' ? s.song.id : null)).filter(id => id !== null) as string[];

    await backendService.reorderPlaylistSongs({ playlistId: state.currentPlaylistId!, songIds: songIds });
    state.playlistSongs = await backendService.getPlaylistSongs({ playlistId: state.currentPlaylistId! });
  };

  const orderSongsByColumn = (column: string, asc: boolean) => {
    const sortedSongs = [...state.playlistSongs].sort((a, b) => {
      const aValue = a.metadata[column as keyof typeof a.metadata];
      const bValue = b.metadata[column as keyof typeof b.metadata];

      if (aValue === bValue) return 0;
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return aValue - bValue;
      }

      return String(aValue).localeCompare(String(bValue));
    });

    return asc ? sortedSongs : sortedSongs.reverse();
  };
  const onOrderBy = async (column?: string, asc = true) => {
    if (!state.currentPlaylistId) {
      if (column) {
        sortQueueByColumn(state, column, asc);
      } else {
        shuffleQueue(state);
      }
      return;
    }
    if (column) {
      await backendService.reorderPlaylistSongs({
        playlistId: state.currentPlaylistId!,
        songIds: orderSongsByColumn(column, asc).map(s => s.id),
      });
    } else {
      await backendService.shufflePlaylist(state.currentPlaylistId!);
    }
    state.playlistSongs = await backendService.getPlaylistSongs({ playlistId: state.currentPlaylistId! });
  };

  let playlistList: HTMLUListElement = PlaylistList(state.playlists, onPlaylistSelected);
  let playlistSongs = PlaylistSongs({
    songs: state.currentPlaylist ? songListToQueueItems(state.playlistSongs) : state.queue,
    onSelected: onSongSelected,
    onReorder,
  });
  let playlistEditor = PlaylistEditor({ playlist: state.currentPlaylist, playlistSongs, onOrderBy });
  const form = PlaylistUi({ playlistList, playlistEditor });

  form.onsubmit = (e: SubmitEvent) => {
    e.preventDefault();
    const clickedButton = e.submitter as HTMLButtonElement;
    switch (clickedButton.id) {
      case 'add-playlist':
        addPlaylist();
        break;
      case 'shuffle':
        onOrderBy();
        break;
      default:
        if (clickedButton.hasAttribute('data-action')) {
          switch (clickedButton.getAttribute('data-action')) {
            case 'delete-playlist':
              const playlistId = clickedButton.value;
              if (playlistId) {
                const playlist = state.playlists.find(p => p.id === playlistId);
                if (playlist) {
                  onPlaylistDeleted(playlist);
                }
              }
              return;
            case 'remove-item':
              const itemIndex = parseInt(clickedButton.value, 10);
              removeSong(itemIndex);
              return;
            default:
              break;
          }
        }
    }
  };

  state.addListener('playlists', () => {
    playlistList = replaceWith(playlistList, PlaylistList(state.playlists, onPlaylistSelected)) as HTMLUListElement;
  });

  state.addListener('currentPlaylistId', async () => {
    state.playlistSongs = await backendService.getPlaylistSongs({ playlistId: state.currentPlaylistId! });
    playlistEditor = replaceWith(
      playlistEditor,
      PlaylistEditor({ playlist: state.currentPlaylist, playlistSongs, onOrderBy })
    ) as HTMLDivElement;
  });

  state.addListener('playlistSongs', () => {
    playlistSongs = replaceWith(
      playlistSongs,
      PlaylistSongs({
        songs: state.currentPlaylist ? songListToQueueItems(state.playlistSongs) : state.queue,
        onSelected: onSongSelected,
        onReorder,
      })
    ) as HTMLTableSectionElement;

    // if no current song, set to first song in playlist
    if (!state.currentTrack) {
      state.currentTrack = state.playlistSongs[0] || null;
    }
  });

  state.addListener('queue', () => {
    if (!state.currentPlaylistId) {
      form
        .querySelector('.playlist-songs')!
        .replaceWith(PlaylistSongs({ songs: state.queue, onSelected: onSongSelected, onReorder }));
    }
  });

  refreshPlaylists(state, backendService);
  return form;
}
