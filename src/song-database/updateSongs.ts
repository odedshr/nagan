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

export async function saveUpdatedSongsPerSong(
  backendService: BackendService,
  dbCopy: Song[],
  updatesBySongId: Record<string, Partial<SongMetadata>>
): Promise<Song[]> {
  let nextDb = [...dbCopy];

  for (const [songId, metadata] of Object.entries(updatesBySongId)) {
    const updatedSong = await backendService.updateSong({
      id: songId,
      metadata,
      update_id3: true,
    });

    if (updatedSong) {
      nextDb = nextDb.map(s => (s.id === updatedSong.id ? updatedSong : s));
      continue;
    }

    // Fallback: merge locally if backend doesn't return the updated entity.
    nextDb = nextDb.map(s => (s.id === songId ? ({ ...s, metadata: { ...s.metadata, ...metadata } } as Song) : s));
  }

  return nextDb;
}
