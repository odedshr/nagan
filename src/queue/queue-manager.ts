import { QueueItem, Song, Playlist, State, RepeatMode } from '../types';

// Add item to end of queue
export function enqueue(state: State, item: QueueItem): void {
    state.queue = [...state.queue, item];
}

// Add item to front of queue (play next)
export function enqueueNext(state: State, item: QueueItem): void {
    state.queue = [item, ...state.queue];
}

// Add multiple items to front of queue (play next)
export function enqueueNextMultiple(state: State, items: QueueItem[]): void {
    state.queue = [...items, ...state.queue];
}

// Remove and return first item from queue
export function dequeue(state: State): QueueItem | null {
    if (state.queue.length === 0) return null;
    const [next, ...rest] = state.queue;
    if (next===null) {
        return null;
    }

    state.queue = rest;
    return next;
}

// Clear the entire queue
export function clearQueue(state: State): void {
    state.queue = [];
}

// Add a song to queue
export function enqueueSong(state: State, song: Song): void {
    enqueue(state, { type: 'song', song });
}

// Add multiple songs to queue
export function enqueueSongs(state: State, songs: Song[]): void {
    songs.forEach(song => enqueueSong(state, song));
}

// Add multiple songs to front of queue (play next)
export function enqueueSongsNext(state: State, songs: Song[]): void {
    const items: QueueItem[] = songs.map(song => ({ type: 'song', song }));
    enqueueNextMultiple(state, items);
}

// Add a section to queue
export function enqueueSection(state: State, song: Song, startTime: number, endTime: number): void {
    enqueue(state, { type: 'section', song, startTime, endTime });
}

// Add a playlist to queue (expands to all songs in playlist)
export function enqueuePlaylist(state: State, playlist: Playlist): void {
    enqueue(state, { type: 'playlist', playlist });
}

// Set repeat mode
export function setRepeatMode(state: State, mode: RepeatMode): void {
    state.repeat = mode;
}

// Cycle through repeat modes
export function cycleRepeatMode(state: State): void {
    const modes: RepeatMode[] = ['none', 'song', 'playlist', 'section'];
    const currentIndex = modes.indexOf(state.repeat);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(state, nextMode);
}

export function shuffleQueue(state: State): void {
    const copy = [...state.queue];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    state.queue = copy;
}