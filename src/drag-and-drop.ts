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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function handleFileDrop(event: DragEvent) {
  event.preventDefault();
  document.body.classList.remove('drag-active');
  
  if (!event.dataTransfer?.files) return;
  
  const files = Array.from(event.dataTransfer.files);
  const uniqueFiles = new Map<string, File>();
  const duplicates: string[] = [];
  
  // Detect duplicates by filename
  files.forEach(file => {
    const key = `${file.name}-${file.size}`;
    if (uniqueFiles.has(key)) {
      duplicates.push(file.name);
    } else {
      uniqueFiles.set(key, file);
    }
  });
  
  if (duplicates.length > 0) {
    console.log(`⚠️ Duplicates detected and discarded: ${duplicates.join(', ')}`);
  }
  
  const uniqueFileArray = Array.from(uniqueFiles.values());
  let audioCount = 0;
  let nonAudioCount = 0;
  
  console.log(`\n📂 ${uniqueFileArray.length} file(s) dropped:`);
  
  uniqueFileArray.forEach(file => {
    const isAudio = isAudioFile(file);
    const icon = isAudio ? '✓' : '✗';
    const type = isAudio ? 'audio' : 'not audio';
    
    console.log(`${icon} ${file.name} | ${file.type || 'unknown'} | ${formatFileSize(file.size)} | ${type}`);
    
    if (isAudio) {
      audioCount++;
    } else {
      nonAudioCount++;
    }
  });
  
  console.log(`\n📊 Summary: ${audioCount} audio file(s), ${nonAudioCount} non-audio file(s)\n`);
}

export default function initDragAndDrop() {
  document.body.addEventListener('dragover', (event) => {
    event.preventDefault();
    document.body.classList.add('drag-active');
  });
  
  document.body.addEventListener('dragleave', (event) => {
    // Only remove class if we're leaving the body itself, not child elements
    if (event.target === document.body) {
      document.body.classList.remove('drag-active');
    }
  });
  
  document.body.addEventListener('drop', handleFileDrop);
}