import { QueueItem, Song } from './../types';
import { showPrompt } from '../ui-components/prompt/prompt.ts';
import { showConfirm } from '../ui-components/confirm/confirm.ts';
import { State, Playlist } from '../types.ts';
import PlaylistList from './Playlist-list.tsx';
import PlaylistUi from './PlaylistManager.tsx';
import PlaylistEditor from './playlist-editor.tsx';
import PlaylistSongs from './playlist-songs.tsx';
import { BackendService } from '../backend/backend.ts';
import { shuffleQueue } from '../queue/queue-manager.ts';

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
    const playlistName = await showPrompt('Enter playlist name:');
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
    if (await showConfirm(`Are you sure you want to delete the playlist "${playlist.name}"?`, 'Delete', 'Cancel')) {
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
      await backendService.removeSongFromPlaylist({ playlistId: state.currentPlaylistId!, position: position + 1 });
      state.playlistSongs = await backendService.getPlaylistSongs({ playlistId: state.currentPlaylistId! });
    }
  };

  const onReorder = async (oldPosition: number, newPosition: number) => {
    if (!state.currentPlaylistId) {
      // reorder queue
      const updatedQueue = [...state.queue];
      const [movedItem] = updatedQueue.splice(oldPosition, 1);
      updatedQueue.splice(newPosition, 0, movedItem);
      state.queue = updatedQueue;
      return;
    }

    const songIds = state.playlistSongs.map(s => s.id);
    const [movedSongId] = songIds.splice(oldPosition, 1);
    songIds.splice(newPosition, 0, movedSongId);
    await backendService.reorderPlaylistSongs({ playlistId: state.currentPlaylistId!, songIds: songIds });
    state.playlistSongs = await backendService.getPlaylistSongs({ playlistId: state.currentPlaylistId! });
  };

  const onOrderBy = async (column?: string, asec?: boolean) => {
    if (!state.currentPlaylistId) {
      shuffleQueue(state);
      return;
    }
    if (!column) {
      await backendService.shufflePlaylist(state.currentPlaylistId!);
    }
    console.log(`Ordering by ${column} ${asec ? 'asc' : 'desc'}`);
    state.playlistSongs = await backendService.getPlaylistSongs({ playlistId: state.currentPlaylistId! });
  };

  const form = PlaylistUi(
    state.playlists,
    state.currentPlaylist,
    state.currentPlaylist ? songListToQueueItems(state.playlistSongs) : state.queue,
    onPlaylistSelected,
    onSongSelected,
    onReorder,
    onOrderBy
  );

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
        console.log('Playlist form submitted' + e.submitter?.id);
    }
  };

  state.addListener('playlists', () =>
    form.querySelector('.playlists')!.replaceWith(PlaylistList(state.playlists, onPlaylistSelected))
  );

  state.addListener('currentPlaylistId', async () => {
    form
      .querySelector('.playlist-editor')!
      .replaceWith(PlaylistEditor(state.currentPlaylist, [], onSongSelected, onReorder, onOrderBy));
    state.playlistSongs = await backendService.getPlaylistSongs({ playlistId: state.currentPlaylistId! });
  });

  state.addListener('playlistSongs', () => {
    form
      .querySelector('.playlist-songs')!
      .replaceWith(PlaylistSongs(songListToQueueItems(state.playlistSongs), onSongSelected, onReorder));
    // if no current song, set to first song in playlist
    if (!state.currentTrack) {
      state.currentTrack = state.playlistSongs[0] || null;
    }
  });

  state.addListener('queue', () => {
    if (!state.currentPlaylistId) {
      form.querySelector('.playlist-songs')!.replaceWith(PlaylistSongs(state.queue, onSongSelected, onReorder));
    }
  });

  refreshPlaylists(state, backendService);
  return form;
}
