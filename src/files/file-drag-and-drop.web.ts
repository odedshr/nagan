import { State } from '../types';

function isFileDrag(event: DragEvent): boolean {
  return Boolean(event.dataTransfer?.types?.includes('Files'));
}

function isAudioFile(file: File): boolean {
  const audioMimeTypes = ['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/webm'];

  // Check MIME type first
  if (audioMimeTypes.includes(file.type)) {
    return true;
  }

  // Fallback to extension check for files with generic/missing MIME types
  const audioExtensions = ['.mp3', '.m4a', '.ogg', '.wav', '.flac', '.aac'];
  return audioExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
}

function handleFileDrop(state: State, event: DragEvent) {
  event.preventDefault();
  document.body.classList.remove('drag-active');

  if (!event.dataTransfer?.files) return;

  const uniqueFiles = new Map<string, File>();

  // Detect duplicates by filename
  [...event.dataTransfer.files].forEach(file => {
    const key = `${file.name}-${file.size}`;
    if (!uniqueFiles.has(key)) {
      uniqueFiles.set(key, file);
    }
  });

  const files: File[] = [...uniqueFiles.values()].filter(file => isAudioFile(file));

  state.lastEvent = new CustomEvent('files-dropped', { detail: { files } });
}

export default function initDragAndDrop(state: State) {
  let didLogDragEnter = false;

  const resetDragEnterLog = () => {
    didLogDragEnter = false;
  };

  window.addEventListener(
    'dragenter',
    event => {
      if (!isFileDrag(event)) return;
      if (didLogDragEnter) return;
      didLogDragEnter = true;

      const dt = event.dataTransfer;
      const items = dt?.items ? Array.from(dt.items) : [];
      const files = dt?.files ? Array.from(dt.files) : [];

      const itemDetails = items.map(item => {
        const maybeFile = item.kind === 'file' ? item.getAsFile() : null;
        return {
          kind: item.kind,
          type: item.type,
          name: maybeFile?.name,
          size: maybeFile?.size,
        };
      });

      const fileDetails = files.map(file => ({ name: file.name, size: file.size, type: file.type }));

      console.log('Drag entered window (files):', {
        types: dt?.types ? Array.from(dt.types) : [],
        items: itemDetails,
        files: fileDetails,
      });
    },
    { capture: true }
  );

  // Prevent default browser behavior (opening the file / navigating away)
  window.addEventListener(
    'dragover',
    event => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
    },
    { capture: true }
  );

  window.addEventListener(
    'drop',
    event => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      resetDragEnterLog();
    },
    { capture: true }
  );

  document.body.addEventListener('dragover', event => {
    event.preventDefault();
    document.body.classList.add('drag-active');
  });

  document.body.addEventListener('dragend', () => {
    document.body.classList.remove('drag-active');
    resetDragEnterLog();
  });

  document.body.addEventListener('drop', handleFileDrop.bind(null, state));
}
