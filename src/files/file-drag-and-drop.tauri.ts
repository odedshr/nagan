import { listen } from '@tauri-apps/api/event';

import { State } from '../types';
import loadFile from './load-file.tauri';

function isFileDrag(event: DragEvent): boolean {
  return Boolean(event.dataTransfer?.types?.includes('Files'));
}

async function handleTauriFileDrop(state: State, paths: string[]) {
  const uniquePaths = [...new Set(paths)].filter(Boolean);
  if (uniquePaths.length === 0) {
    return;
  }

  const results = await Promise.allSettled(uniquePaths.map(path => loadFile(path)));

  const files: File[] = [];
  const failures: Array<{ path: string; reason: unknown }> = [];

  results.forEach((result, index) => {
    const path = uniquePaths[index];
    if (result.status === 'fulfilled') {
      const file = result.value as File & { path?: string };
      file.path = path;
      files.push(file);
    } else {
      failures.push({ path, reason: result.reason });
    }
  });

  console.group('Tauri file drop');
  uniquePaths.forEach(path => console.log('Path:', path));
  files.forEach(file => {
    const maybePath = (file as File & { path?: string }).path;
    console.log('File:', { path: maybePath, name: file.name, size: file.size, type: file.type });
  });
  failures.forEach(f => console.warn('Failed to load dropped path:', f.path, f.reason));
  console.groupEnd();

  if (files.length > 0) {
    state.lastEvent = new CustomEvent('files-dropped', { detail: { files } });
  }
}

export default function initFileDragAndDropTauri(state: State) {
  // Prevent default webview behavior (opening the file / navigating away)
  const preventDefaultDragBehavior = (event: DragEvent) => {
    if (isFileDrag(event)) {
      event.preventDefault();
    }
  };

  window.addEventListener('dragenter', preventDefaultDragBehavior, { capture: true });
  window.addEventListener('dragover', preventDefaultDragBehavior, { capture: true });
  window.addEventListener('drop', preventDefaultDragBehavior, { capture: true });
  window.addEventListener('dragenter', preventDefaultDragBehavior, { capture: true });
  window.addEventListener('dragleave', preventDefaultDragBehavior, { capture: true });
  window.addEventListener('dragend', preventDefaultDragBehavior, { capture: true });

  type TauriDragEvent = {
    paths: string[];
    position: { x: number; y: number };
  };

  listen<string[]>('tauri://drag-enter', event =>
    document.body.setAttribute('data-dragged', String((event.payload as unknown as TauriDragEvent).paths?.length))
  );

  listen<string[]>('tauri://drag-leave', () => document.body.removeAttribute('data-dragged'));

  listen<string[]>('tauri://drag-drop', event => {
    document.body.removeAttribute('data-dragged');
    handleTauriFileDrop(state, (event.payload as unknown as TauriDragEvent).paths);
  });
}
