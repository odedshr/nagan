import { describe, expect, it } from 'vitest';

import expandFoldersRecursively from './expand-folder.ts';

describe('expandFoldersRecursively (web)', () => {
  it('returns paths unchanged when not running in Tauri', async () => {
    const paths = ['/a', '/b'];
    const result = await expandFoldersRecursively(paths);
    expect(result).toBe(paths);
  });
});
