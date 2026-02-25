import { BackendService } from '../backend/backend.ts';
import { Song, State } from '../types.ts';
import { enqueueSongs } from '../queue/queue-manager.ts';

export type AddSongsToPlaylistDeps = {
  playlistId: string | null;
  songs: Song[];
  backendService: BackendService;
  state: State;
  enqueueSongsFn?: typeof enqueueSongs;
};

export async function addSongsToPlaylist({
  playlistId,
  songs,
  backendService,
  state,
  enqueueSongsFn = enqueueSongs,
}: AddSongsToPlaylistDeps) {
  if (!playlistId) {
    return;
  }

  if (playlistId === 'queue') {
    return enqueueSongsFn(state, songs);
  }

  await Promise.all(
    songs.map(async song => {
      try {
        await backendService.addSongToPlaylist({ playlistId, songId: song.id });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        state.lastEvent = new CustomEvent('notification', {
          detail: {
            type: 'error',
            message: `Failed to add song ${song.metadata.title || song.filename} to playlist (${message})`,
          },
        });
      }
    })
  );

  if (state.currentPlaylistId === playlistId) {
    state.playlistSongs = await backendService.getPlaylistSongs({ playlistId: state.currentPlaylistId });
  }
}
