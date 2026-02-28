import { Song, TauriFile } from '../types.ts';
import { OnEventFn } from '../utils/on-event.ts';
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

export type processSongsParams = {
  files: File[];
  onEvent: OnEventFn;
  addSong: (filePath: string) => Promise<Song>;
  updateSong: (payload: {
    id: string;
    metadata: Partial<Song['metadata']>;
    update_id3: boolean;
  }) => Promise<Song | null>;
  analyzeGenres?: (addedSongs: Song[]) => Promise<Song[]>;
  analyzeBpm?: (addedSongs: Song[]) => Promise<Song[]>;
};

export default async function processSongs({
  files,
  onEvent,
  addSong,
  updateSong,
  analyzeGenres,
  analyzeBpm,
}: processSongsParams): Promise<Song[]> {
  const filesToProcess = getUniqueFiles(files.filter(isAudioFile));
  const addedSongs: Song[] = [];

  while (filesToProcess.length > 0) {
    const file = filesToProcess.shift()!;
    try {
      const filePath = (file as Partial<TauriFile>).path || file.name;
      const addedSong = await addSong(filePath);
      onEvent('file-loaded', { file });
      addedSongs.push(addedSong);
    } catch (error) {
      onEvent('notification', { type: 'error', message: error } as const);
    }
  }

  if (analyzeGenres) {
    const updatedSongs = await analyzeGenres(addedSongs);
    updatedSongs.forEach(song =>
      updateSong({ id: song.id, metadata: { genres: song.metadata.genres }, update_id3: true })
    );
  }

  if (analyzeBpm) {
    const updatedSongs = await analyzeBpm(addedSongs);
    updatedSongs.forEach(song => updateSong({ id: song.id, metadata: { bpm: song.metadata.bpm }, update_id3: true }));
  }
  return addedSongs;
}
