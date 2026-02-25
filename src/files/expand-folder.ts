import isTauri from '../utils/is-tauri.ts';

type readDirFn = (
  path: string,
  options?:
    | {
        recursive?: boolean | undefined;
      }
    | undefined
) => Promise<{ name: string; isDirectory: boolean }[]>;

export default async function expandFoldersRecursively(paths: string[]): Promise<string[]> {
  if (!isTauri()) {
    return paths;
  }

  const fs = await import('@tauri-apps/plugin-fs');
  const readDir = fs.readDir as unknown as readDirFn;

  return (await Promise.all(paths.map(p => flattenFolder(readDir, p)))).flat();
}

function flattenFolder(readDir: readDirFn, basePath: string): Promise<string[]> {
  const normalizedBasePath = basePath.replace(/\/+$/, '');

  return (async () => {
    const files: string[] = [];
    const directoriesToVisit: string[] = [normalizedBasePath];

    while (directoriesToVisit.length > 0) {
      const currentDir = directoriesToVisit.pop()!;
      const entries = await readDir(currentDir, { recursive: false });

      for (const entry of entries) {
        const fullPath = `${currentDir}/${entry.name}`;
        if (entry.isDirectory) {
          directoriesToVisit.push(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    }

    return files;
  })();
}
