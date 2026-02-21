import { BackendService } from '../backend/backend.ts';
import { enqueueSongs } from '../queue/queue-manager.ts';
import { Song, State } from '../types.ts';
import selectFile from '../files/select-file.ts';

export type BrowseFileDeps = {
  state: State;
  backendService: BackendService;
  refreshDb: () => void | Promise<void>;
  selectFiles?: typeof selectFile;
};

export async function browseFile({ state, backendService, refreshDb, selectFiles = selectFile }: BrowseFileDeps) {
  ((await selectFiles()) || []).forEach(async file => {
    try {
      await backendService.addSong(file.name);
      state.lastEvent = new CustomEvent('file-loaded', { detail: { file } });
      await refreshDb();
    } catch (error) {
      state.lastEvent = new CustomEvent('notification', { detail: { type: 'error', message: error } });
      return;
    }
  });
}

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
      } catch (error) {
        console.error(`❌ Failed to add song ${song.id} to playlist ${playlistId}:`, error);
      }
    })
  );

  if (state.currentPlaylistId === playlistId) {
    state.playlistSongs = await backendService.getPlaylistSongs({ playlistId: state.currentPlaylistId });
  }
}

export function songsFromIds(db: Song[], songIds: FormDataEntryValue[]): Song[] {
  return songIds.map(songId => db.find(s => s.id === songId)).filter(s => s !== undefined) as Song[];
}
