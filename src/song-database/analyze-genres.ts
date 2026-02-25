import { BackendService } from '../backend/backend.ts';
import { Song } from '../types.ts';
import { getMusicBrainzGenres } from '../utils/musicbrainz.ts';

export default async function autoAnalyzeGenresForSong(
  backendService: BackendService,
  song: Song
): Promise<Song | null> {
  try {
    const title = song.metadata.title || song.filename;
    const genres = await getMusicBrainzGenres({ title, artists: song.metadata.artists });
    if (!!genres && genres.length > 0) {
      return await backendService.updateSong({ id: song.id, metadata: { genres } });
    }
  } catch (error) {
    // Auto-analysis is best-effort; avoid spamming notifications.
    console.warn('Auto genre analysis failed:', error);
  }

  return song;
}
