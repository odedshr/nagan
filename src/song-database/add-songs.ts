import { BackendService } from '../backend/backend.ts';
import { State } from '../types.ts';
import selectFile from '../files/select-file.ts';
import processSongs from './process-songs.ts';

export async function browseFile(state: State, backendService: BackendService) {
  const files: File[] = (await selectFile()) || [];
  return await processSongs(files, state, backendService);
}
