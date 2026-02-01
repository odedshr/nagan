import { State } from "./types";

function isAudioFile(file: File): boolean {
  const audioMimeTypes = [
    'audio/mpeg',
    'audio/mp4',
    'audio/ogg',
    'audio/wav',
    'audio/flac',
    'audio/aac',
    'audio/webm',
  ];
  
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

export default function initDragAndDrop(state:State) {
  document.body.addEventListener('dragover', (event) => {
    event.preventDefault();
    document.body.classList.add('drag-active');
  });
  
  // document.body.addEventListener('dragleave', (event) => {
  //   // Only remove class if we're leaving the body itself, not child elements
  //   // if (event.target === document.body) {
  //     document.body.classList.remove('drag-active');
  //   // }
  // });

  document.body.addEventListener('dragend', () => {
    document.body.classList.remove('drag-active');
  });
  
  document.body.addEventListener('drop', handleFileDrop.bind(null,state));
}