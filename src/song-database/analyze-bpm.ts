import { BackendService } from '../backend/backend.ts';
import { Song } from '../types.ts';

export async function autoAnalyzeBpmForSong(backendService: BackendService, song: Song): Promise<Song | null> {
  try {
    const bpm = await backendService.getSongBpm(song.id);
    if (!!bpm && Number.isFinite(bpm) && bpm > 0) {
      return await backendService.updateSong({ id: song.id, metadata: { bpm: Math.round(bpm) } });
    }
  } catch (error) {
    // Auto-analysis is best-effort; avoid spamming notifications.
    console.warn('Auto BPM analysis failed:', error);
  }
  return song;
}
