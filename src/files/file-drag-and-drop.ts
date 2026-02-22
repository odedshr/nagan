import { State } from '../types';
import isTauri from '../utils/is-tauri';

export default async function initFileDragAndDrop(state: State) {
  const mod = await import(isTauri() ? './file-drag-and-drop.tauri' : './file-drag-and-drop.web');
  mod.default(state);
}
