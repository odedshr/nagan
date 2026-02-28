import { Song } from '../types.ts';
import { getMusicBrainzGenres } from '../utils/musicbrainz.ts';

export async function getSongsGenres(songs: Song[]): Promise<Song[]> {
  const results = await Promise.all(
    songs
      .filter(song => song.metadata.genres === undefined || song.metadata.genres.length === 0)
      .map(song => getSongGenres(song))
  );

  return results.filter((result): result is Song => result !== null);
}

export async function getSongGenres(song: Song): Promise<Song | null> {
  try {
    const title = song.metadata.title || song.filename;
    const genres = await getMusicBrainzGenres({ title, artists: song.metadata.artists });
    if (!!genres && genres.length > 0) {
      return { ...song, metadata: { ...song.metadata, genres } };
    }
  } catch (error) {
    // Auto-analysis is best-effort; avoid spamming notifications.
    console.warn('Auto genre analysis failed:', error);
  }

  return song;
}
