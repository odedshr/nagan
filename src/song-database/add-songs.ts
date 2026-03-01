import { Song } from '../types.ts';
import selectFile from '../files/select-file.ts';
import processSongs from './process-songs.ts';
import { OnEventFn } from '../utils/on-event.ts';

export type BrowseFilesProps = {
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

export async function browseFiles({ onEvent, addSong, updateSong, analyzeGenres, analyzeBpm }: BrowseFilesProps) {
  return await processSongs({
    files: ((await selectFile()) || []) as File[],
    onEvent,
    addSong,
    updateSong,
    analyzeGenres,
    analyzeBpm,
  });
}
