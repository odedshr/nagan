import openProgressModal from '../ui-components/progress/Progress.tsx';
import { Song } from '../types.ts';

export async function getSongsBPMs(
  songsToAnalyze: Song[],
  getSongBpm: (songId: string) => Promise<number | null>
): Promise<Song[]> {
  const progress = openProgressModal('Analyzing BPM', songsToAnalyze.length);
  const updateSongs: Song[] = [];

  try {
    for (let i = 0; i < songsToAnalyze.length; i++) {
      if (progress.isCancelled()) {
        return [];
      }

      const song = songsToAnalyze[i];
      progress.update(i + 1, songsToAnalyze.length, song.metadata.title || song.filename);

      try {
        const bpm = await getSongBpm(song.id);

        if (bpm !== null && bpm !== undefined && Number.isFinite(bpm)) {
          updateSongs.push({ ...song, metadata: { ...song.metadata, bpm: Math.round(bpm) } });
        }
      } catch (error) {
        console.warn('Error analyzing BPM for song:', error);
      }
    }

    return updateSongs;
  } catch (error) {
    console.error('Error analyzing BPMs:', error);
    return [];
  } finally {
    progress.close();
  }
}
