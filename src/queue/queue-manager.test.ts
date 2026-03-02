import { describe, expect, it, vi, afterEach } from 'vitest';

import type { Song, State } from '../types.ts';

import {
  clearQueue,
  cycleRepeatMode,
  dequeue,
  enqueue,
  enqueueNext,
  enqueueNextMultiple,
  enqueueSection,
  enqueueSong,
  enqueueSongsNext,
  setRepeatMode,
  shuffleQueue,
  sortQueueByColumn,
} from './queue-manager.ts';

function makeSong(id = 's1', metadataOverrides: Partial<Song['metadata']> = {}): Song {
  return {
    id,
    url: `file:///${id}.mp3`,
    filename: `${id}.mp3`,
    available: true,
    metadata: {
      title: 'Title',
      album: 'Album',
      duration: 120,
      artists: 'Artist',
      genres: ['Rock'],
      tags: [],
      file_exists: true,
      times_played: 0,
      ...metadataOverrides,
    },
  };
}

function makeState(): State {
  return {
    queue: [],
    repeat: 'none',
  } as unknown as State;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('queue-manager', () => {
  it('enqueues items to end and front', () => {
    const state = makeState();
    const song1 = makeSong('a', { title: 'A' });
    const song2 = makeSong('b', { title: 'B' });

    enqueueSong(state, song1);
    enqueueNext(state, { type: 'song', song: song2 });

    expect(state.queue[0]).toMatchObject({ type: 'song', song: { id: 'b' } });
    expect(state.queue[1]).toMatchObject({ type: 'song', song: { id: 'a' } });
  });

  it('dequeue returns null for empty queue and consumes first item', () => {
    const state = makeState();
    expect(dequeue(state)).toBeNull();

    enqueue(state, { type: 'song', song: makeSong('x') });
    const next = dequeue(state);
    expect(next).toMatchObject({ type: 'song', song: { id: 'x' } });
    expect(state.queue).toEqual([]);
  });

  it('dequeue returns null if the next item is null (sentinel)', () => {
    const state = makeState();
    state.queue = [null as unknown as never];
    expect(dequeue(state)).toBeNull();
  });

  it('enqueueSection adds a section item', () => {
    const state = makeState();
    enqueueSection(state, makeSong('s'), 1, 2);
    expect(state.queue[0]).toMatchObject({ type: 'section', startTime: 1, endTime: 2, song: { id: 's' } });
  });

  it('clearQueue empties the queue', () => {
    const state = makeState();
    enqueueSong(state, makeSong('a'));
    clearQueue(state);
    expect(state.queue).toEqual([]);
  });

  it('cycles repeat mode', () => {
    const state = makeState();
    expect(state.repeat).toBe('none');
    cycleRepeatMode(state);
    expect(state.repeat).toBe('song');
    cycleRepeatMode(state);
    expect(state.repeat).toBe('playlist');
    setRepeatMode(state, 'section');
    cycleRepeatMode(state);
    expect(state.repeat).toBe('none');
  });

  it('enqueueNextMultiple and enqueueSongsNext prepend items', () => {
    const state = makeState();
    const a = makeSong('a');
    const b = makeSong('b');

    enqueueSong(state, makeSong('tail'));
    enqueueNextMultiple(state, [
      { type: 'song', song: a },
      { type: 'song', song: b },
    ]);
    expect(state.queue.map(i => (i as any).song?.id)).toEqual(['a', 'b', 'tail']);

    enqueueSongsNext(state, [makeSong('c')]);
    expect(state.queue.map(i => (i as any).song?.id)).toEqual(['c', 'a', 'b', 'tail']);
  });

  it('shuffleQueue shuffles deterministically when Math.random is mocked', () => {
    const state = makeState();
    state.queue = [
      { type: 'song', song: makeSong('1') },
      { type: 'song', song: makeSong('2') },
      { type: 'song', song: makeSong('3') },
    ];

    vi.spyOn(Math, 'random').mockReturnValue(0);
    shuffleQueue(state);

    expect(state.queue.map(i => (i as any).song?.id)).toEqual(['2', '3', '1']);
  });

  it('sortQueueByColumn sorts songs and supports asc/desc', () => {
    const state = makeState();
    state.queue = [
      {
        type: 'song',
        song: makeSong('a', { title: 'B', album: 'x', duration: 1, artists: 'a', genres: [], tags: [] }),
      },
      {
        type: 'song',
        song: makeSong('b', { title: 'A', album: 'x', duration: 1, artists: 'a', genres: [], tags: [] }),
      },
      {
        type: 'song',
        song: makeSong('c', { title: 'C', album: 'x', duration: 1, artists: 'a', genres: [], tags: [], year: 2020 }),
      },
    ];

    sortQueueByColumn(state, 'title', true);
    expect(state.queue.map(i => (i as any).song?.id)).toEqual(['b', 'a', 'c']);

    sortQueueByColumn(state, 'title', false);
    expect(state.queue.map(i => (i as any).song?.id)).toEqual(['c', 'a', 'b']);
  });

  it('sortQueueByColumn places missing values last', () => {
    const state = makeState();
    state.queue = [
      { type: 'song', song: makeSong('has', { year: 1999 }) },
      { type: 'song', song: makeSong('missing', { year: undefined }) },
    ];

    sortQueueByColumn(state, 'year', true);
    expect(state.queue.map(i => (i as any).song?.id)).toEqual(['has', 'missing']);
  });
});
