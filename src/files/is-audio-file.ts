import { TauriFile } from '../types.ts';

export function isAudioPath(path: string): boolean {
  const lower = path.toLowerCase();
  return (
    lower.endsWith('.mp3') ||
    lower.endsWith('.m4a') ||
    lower.endsWith('.ogg') ||
    lower.endsWith('.wav') ||
    lower.endsWith('.flac') ||
    lower.endsWith('.aac') ||
    lower.endsWith('.wma') ||
    lower.endsWith('.webm')
  );
}

export function isAudioFile(file: File): boolean {
  const audioMimeTypes = ['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/webm'];
  if (audioMimeTypes.includes(file.type)) {
    return true;
  }

  const maybePath =
    (file as Partial<TauriFile>).path ||
    (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
    file.name;
  return Boolean(maybePath) && isAudioPath(maybePath);
}
