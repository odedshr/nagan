import { readFile } from '@tauri-apps/plugin-fs';

export default async function loadFile(path: string): Promise<File> {
  const bytes = await readFile(path);
  return new File([bytes], path);
}
