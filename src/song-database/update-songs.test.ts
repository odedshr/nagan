import { describe, expect, it, vi } from 'vitest';

import type { BackendService } from '../backend/backend.ts';
import type { Song, SongMetadata } from '../types.ts';
import { saveUpdatedSongs, saveUpdatedSongsPerSong } from './update-songs.ts';

function song(id: string, metadata?: Partial<SongMetadata>): Song {
  return {
    id,
    url: `file://${id}`,
    filename: `${id}.mp3`,
    metadata: {
      title: id,
      album: 'a',
      duration: 1,
      artists: 'x',
      genres: [],
      tags: [],
      file_exists: true,
      times_played: 0,
      ...metadata,
    },
    available: true,
  };
}

describe('updateSongs', () => {
  it('returns dbCopy when no songs to update', async () => {
    const backendService = {} as BackendService;
    const db = [song('1'), song('2')];

    const result = await saveUpdatedSongs(backendService, [...db], [], { title: 'x' });

    expect(result).toEqual(db);
  });

  it('updates single song via updateSong when backend returns updated song', async () => {
    const backendService = {
      updateSong: vi.fn(async () => song('2', { title: 'new' })),
    } as unknown as BackendService;

    const db = [song('1', { title: 'a' }), song('2', { title: 'b' })];

    const result = await saveUpdatedSongs(backendService, [...db], [db[1]], { title: 'new' });

    expect(backendService.updateSong).toHaveBeenCalledWith({ id: '2', metadata: { title: 'new' }, update_id3: true });
    expect(result[1].id).toEqual('2');
    expect(result[1].metadata.title).toEqual('new');
  });

  it('keeps dbCopy when updateSong returns null', async () => {
    const backendService = {
      updateSong: vi.fn(async () => null),
    } as unknown as BackendService;

    const db = [song('1', { title: 'a' }), song('2', { title: 'b' })];

    const result = await saveUpdatedSongs(backendService, [...db], [db[1]], { title: 'new' });

    expect(result).toEqual(db);
  });

  it('bulk updates multiple songs by merging metadata locally', async () => {
    const backendService = {
      bulkUpdateSongs: vi.fn(async () => 2),
    } as unknown as BackendService;

    const db = [
      song('1', { title: 'a', year: 1999 }),
      song('2', { title: 'b', year: 2000 }),
      song('3', { title: 'c', year: 2001 }),
    ];

    const result = await saveUpdatedSongs(backendService, [...db], [db[0], db[2]], { year: 2020 });

    expect(backendService.bulkUpdateSongs).toHaveBeenCalledWith({
      ids: ['1', '3'],
      updates: { year: 2020 },
      update_id3: true,
    });

    expect(result.find(s => s.id === '1')!.metadata.year).toBe(2020);
    expect(result.find(s => s.id === '3')!.metadata.year).toBe(2020);
    expect(result.find(s => s.id === '2')!.metadata.year).toBe(2000);
  });

  it('updates multiple songs per-song via updateSong', async () => {
    const updateSong = vi.fn(async (payload: { id: string; metadata: Partial<SongMetadata> }) =>
      song(payload.id, payload.metadata)
    );
    const backendService = { updateSong } as unknown as BackendService;

    const db = [song('1', { title: 'a' }), song('2', { title: 'b' }), song('3', { title: 'c' })];

    const result = await saveUpdatedSongsPerSong(backendService, [...db], {
      '1': { bpm: 111 },
      '3': { bpm: 133 },
    });

    expect(updateSong).toHaveBeenCalledTimes(2);
    expect(result.find(s => s.id === '1')!.metadata.bpm).toBe(111);
    expect(result.find(s => s.id === '3')!.metadata.bpm).toBe(133);
    expect(result.find(s => s.id === '2')!.metadata.bpm).toBeUndefined();
  });
});
