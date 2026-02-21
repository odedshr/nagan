import { BackendService } from '../backend/backend.ts';
import { Song, SongMetadata } from '../types.ts';

export async function saveUpdatedSongs(
  backendService: BackendService,
  dbCopy: Song[],
  songsToUpdate: Song[],
  metadata: Partial<SongMetadata>
): Promise<Song[]> {
  switch (songsToUpdate.length) {
    case 0:
      break;
    case 1: {
      const updatedSong = await backendService.updateSong({
        id: songsToUpdate[0].id,
        metadata,
        update_id3: true,
      });

      if (updatedSong) {
        return dbCopy.map(s => (s.id === updatedSong.id ? updatedSong : s));
      }

      break;
    }
    default: {
      await backendService.bulkUpdateSongs({
        ids: songsToUpdate.map(s => s.id),
        updates: metadata,
        update_id3: true,
      });

      const updateSongById: { [id: string]: Song } = {};
      songsToUpdate.forEach(s => (updateSongById[s.id] = { ...s, metadata: { ...s.metadata, ...metadata } } as Song));

      return dbCopy.map(s => updateSongById[s.id] || s);
    }
  }
  return dbCopy;
}
