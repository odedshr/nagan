import isTauri from '../utils/is-tauri.ts';

export default async function loadFile(path: string): Promise<File> {
  if (isTauri()) {
    return import('./load-file.tauri.ts').then(module => module.default(path));
  }

  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }

  const blob = await response.blob();
  const name = path.split('/').pop()?.split('?')[0] || 'file';

  return new File([blob], name, {
    type: blob.type,
    lastModified: Date.now(),
  });
}
