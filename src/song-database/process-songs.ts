import { BackendService } from '../backend/backend.ts';
import { Song, State, TauriFile } from '../types.ts';
import { autoAnalyzeBpmForSong } from './analyze-bpm.ts';
import autoAnalyzeGenresForSong from './analyze-genres.ts';
import { isAudioFile } from '../files/is-audio-file.ts';

function getFileIdentityKey(file: File): string {
  const maybePath =
    (file as Partial<TauriFile>).path || (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  return maybePath || `${file.name}-${file.size}`;
}

function getUniqueFiles(files: File[]): File[] {
  const uniqueFiles = new Map<string, File>();

  files.forEach(file => {
    const key = getFileIdentityKey(file);
    if (!uniqueFiles.has(key)) {
      uniqueFiles.set(key, file);
    }
  });

  return [...uniqueFiles.values()];
}

export default async function processSongs(files: File[], state: State, backendService: BackendService) {
  const filesToProcess = getUniqueFiles(files.filter(isAudioFile));
  const addedSongs: Song[] = [];

  while (filesToProcess.length > 0) {
    const file = filesToProcess.shift()!;
    try {
      const filePath = (file as Partial<TauriFile>).path || file.name;
      const addedSong = await backendService.addSong(filePath);
      state.lastEvent = new CustomEvent('file-loaded', { detail: { file } });
      addedSongs.push(addedSong);
    } catch (error) {
      state.lastEvent = new CustomEvent('notification', { detail: { type: 'error', message: error } });
    }
  }

  if (state.preferences?.autoAnalyzeGenres) {
    await Promise.all(
      addedSongs
        .filter(song => song.metadata.genres === undefined || song.metadata.genres.length === 0)
        .map(song => autoAnalyzeGenresForSong(backendService, song))
    );
  }
  if (state.preferences?.autoAnalyzeBpm) {
    await Promise.all(
      addedSongs
        .filter(song => typeof song.metadata.bpm === 'undefined')
        .map(song => autoAnalyzeBpmForSong(backendService, song))
    );
  }
  return addedSongs;
}
