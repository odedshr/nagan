# Task 1: Implement Queue System

## Overview
Implement a queue system in the application state that allows queuing songs, sections (song segments), and playlists for continuous playback with repeat functionality.

---

## Data Types

### 1. Add new types to `src/types.ts`

```typescript
// Section represents a portion of a song to play
export interface Section {
  type: 'section';
  song: songId;
  startTime: number;  // in seconds
  endTime: number;    // in seconds
}

// QueueItem can be a song, section, or playlist
export type QueueItem = 
  | { type: 'song'; song: songId }
  | Section
  | { type: 'playlist'; playlist: Playlist };

// Repeat modes
export type RepeatMode = 'none' | 'section' | 'song' | 'playlist';
```

### 2. Update `StateBase` in `src/types.ts`

Add the following properties to `StateBase`:

```typescript
export type StateBase = {
  // ... existing properties ...
  
  // Queue system
  queue: QueueItem[];
  repeat: RepeatMode;
  currentSection: Section | null;  // Track if playing a section
}
```

---

## Implementation Steps

### Step 1: Initialize State Defaults

In the state initialization (likely in `main.ts` or Context setup):

```typescript
const initialState: StateBase = {
  // ... existing defaults ...
  queue: [],
  repeat: 'none',
  currentSection: null,
};
```

### Step 2: Create Queue Manager Functions

Create a new file `src/queue/queue-manager.ts`:

```typescript
import { QueueItem, Song, Section, Playlist, State, RepeatMode } from '../types';

// Add item to end of queue
export function enqueue(state: State, item: QueueItem): void {
  state.queue = [...state.queue, item];
}

// Add item to front of queue (play next)
export function enqueueNext(state: State, item: QueueItem): void {
  state.queue = [item, ...state.queue];
}

// Remove and return first item from queue
export function dequeue(state: State): QueueItem | null {
  if (state.queue.length === 0) return null;
  const [next, ...rest] = state.queue;
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

// Add a section to queue
export function enqueueSection(state: State, song: Song, startTime: number, endTime: number): void {
  enqueue(state, { type: 'section', song, startTime, endTime });
}

// Add a playlist to queue (expands to all songs in playlist)
export function enqueuePlaylist(state: State, playlist: Playlist, songs: Song[]): void {
  songs.forEach(song => enqueueSong(state, song));
}

// Set repeat mode
export function setRepeatMode(state: State, mode: RepeatMode): void {
  state.repeat = mode;
}
```

### Step 3: Update Player to Handle Song End Event

Modify `src/player/player.ts` to handle the `ended` event:

```typescript
// Add import for queue functions
import { dequeue, enqueueSong, enqueuePlaylist } from '../queue/queue-manager';

// Inside initPlayer function, add ended event listener:
audio.addEventListener("ended", () => handleSongEnded(state, audio));

function handleSongEnded(state: State, audio: HTMLAudioElement): void {
  const repeat = state.repeat;
  const currentTrack = state.currentTrack;
  const currentSection = state.currentSection;

  // Handle section repeat
  if (repeat === 'section' && currentSection) {
    // Replay the current section
    audio.currentTime = currentSection.startTime;
    audio.play();
    return;
  }

  // Handle song repeat
  if (repeat === 'song' && currentTrack) {
    // Add current song back to front of queue and play it
    enqueueSong(state, currentTrack);
  }

  // Try to play next item from queue
  if (state.queue.length > 0) {
    playNextFromQueue(state);
    return;
  }

  // Queue is empty - check playlist
  if (state.currentPlaylistId && state.playlistSongs.length > 0) {
    const currentIndex = state.playlistSongs.findIndex(s => s.id === currentTrack?.id);
    const nextIndex = currentIndex + 1;

    if (nextIndex < state.playlistSongs.length) {
      // Play next song from playlist
      state.currentTrack = state.playlistSongs[nextIndex];
      return;
    }

    // End of playlist
    if (repeat === 'playlist' && state.currentPlaylist) {
      // Re-queue entire playlist and play first song
      enqueuePlaylist(state, state.currentPlaylist, state.playlistSongs);
      playNextFromQueue(state);
      return;
    }
  }

  // No more songs - stop playback
  stopPlayback(state);
}

function playNextFromQueue(state: State): void {
  const nextItem = dequeue(state);
  if (!nextItem) return;

  switch (nextItem.type) {
    case 'song':
      state.currentSection = null;
      state.currentTrack = nextItem.song;
      break;
    
    case 'section':
      state.currentSection = nextItem;
      state.currentTrack = nextItem.song;
      // Note: startTime will be applied via state listener
      break;
    
    case 'playlist':
      // This shouldn't happen if we expand playlists on enqueue
      // But handle it by enqueueing all songs
      if (state.playlistSongs.length > 0) {
        state.playlistSongs.forEach(song => enqueueSong(state, song));
        playNextFromQueue(state);
      }
      break;
  }
}

function stopPlayback(state: State): void {
  // Reset play button to "play" state
  const audioToggleBtn = document.getElementById("playToggle") as HTMLButtonElement;
  if (audioToggleBtn) {
    audioToggleBtn.value = "play";
    const span = audioToggleBtn.querySelector("span");
    if (span) span.textContent = "Play";
  }
  state.currentTrack = null;
  state.currentSection = null;
}
```

### Step 4: Handle Section Playback

Add a listener for section playback in the player:

```typescript
// In initPlayer, add listener for currentSection
state.addListener("currentSection", (section: Section | null) => {
  if (section) {
    audio.currentTime = section.startTime;
    
    // Set up timeupdate handler to stop at endTime
    const checkEndTime = () => {
      if (audio.currentTime >= section.endTime) {
        audio.removeEventListener('timeupdate', checkEndTime);
        // Trigger ended event logic
        audio.dispatchEvent(new Event('ended'));
      }
    };
    audio.addEventListener('timeupdate', checkEndTime);
  }
});
```

### Step 5: Add UI Controls for Repeat Mode

Create `src/queue/repeat-control.tsx`:

```tsx
import { State, RepeatMode } from '../types';
import { setRepeatMode } from './queue-manager';

export default function RepeatControl(state: State) {
  const cycleRepeat = () => {
    const modes: RepeatMode[] = ['none', 'song', 'playlist', 'section'];
    const currentIndex = modes.indexOf(state.repeat);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(state, nextMode);
  };

  return (
    <button 
      id="repeatBtn" 
      onclick={cycleRepeat}
      class={`repeat-btn repeat-${state.repeat}`}
    >
      <span>{getRepeatIcon(state.repeat)}</span>
    </button>
  );
}

function getRepeatIcon(mode: RepeatMode): string {
  switch (mode) {
    case 'none': return '🔁'; // grayed out
    case 'song': return '🔂'; // repeat one
    case 'playlist': return '🔁'; // repeat all
    case 'section': return '🔃'; // repeat section
  }
}
```

---

## Logic Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                     Song Finished Event                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ repeat='section'│───Yes──► Replay section
                    │ & currentSection│          (seek to startTime)
                    └─────────────────┘
                              │ No
                              ▼
                    ┌─────────────────┐
                    │ repeat='song'?  │───Yes──► Add current song
                    └─────────────────┘          to queue
                              │
                              ▼
                    ┌─────────────────┐
                    │ queue.length>0? │───Yes──► Pop & play next
                    └─────────────────┘          from queue
                              │ No
                              ▼
                    ┌─────────────────┐
                    │ Has playlist &  │───Yes──► Play next song
                    │ more songs?     │          from playlist
                    └─────────────────┘
                              │ No
                              ▼
                    ┌─────────────────┐
                    │ repeat='playlist'│──Yes──► Add playlist songs
                    │ & has playlist? │          to queue, play next
                    └─────────────────┘
                              │ No
                              ▼
                    ┌─────────────────┐
                    │   Stop playing  │
                    └─────────────────┘
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/types.ts` | Modify | Add `Section`, `QueueItem`, `RepeatMode` types; update `StateBase` |
| `src/queue/queue-manager.ts` | Create | Queue manipulation functions |
| `src/player/player.ts` | Modify | Add `ended` event handler and section playback |
| `src/queue/repeat-control.tsx` | Create | Repeat mode UI control |
| `src/queue/styles.css` | Create | Styles for queue UI components |

---

## Testing Checklist

- [ ] Queue a single song and verify it plays after current track
- [ ] Queue multiple songs and verify they play in order
- [ ] Queue a section and verify it plays only the specified time range
- [ ] Test `repeat='song'` - verify song repeats indefinitely
- [ ] Test `repeat='playlist'` - verify playlist restarts after last song
- [ ] Test `repeat='section'` - verify section loops within bounds
- [ ] Test `repeat='none'` - verify playback stops after queue/playlist exhausted
- [ ] Test queue + playlist interaction - queue should take priority
- [ ] Test clearing the queue mid-playback
