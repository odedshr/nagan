# Task 2: Implement Playback History

## Data Types

Add to `src/types.ts`:

```typescript
export interface HistoryEntry {
  songId: string;
  durationPlayed: number;  // total seconds played across all plays
  timesPlayed: number;     // number of times song was played
  lastPlayed: number;      // timestamp of last play
}
```

Update `StateBase`:

```typescript
export type StateBase = {
  // ... existing properties ...
  history: HistoryEntry[];
}
```

## Implementation

### 1. Create `src/history/history-manager.ts`

```typescript
// Update or create history entry when song finishes or changes
function updateHistory(state: State, songId: string, duration: number): void

// Increment play count when a song is considered "played"
// (e.g. on natural track end or when a threshold is reached)
// NOTE: This helper may not exist yet; add it if you need timesPlayed tracking.
function incrementTimesPlayed(state: State, songId: string): void

// Get history entry for a song
function getHistoryEntry(state: State, songId: string): HistoryEntry | undefined

// Clear all history
function clearHistory(state: State): void

// Get most played songs (sorted by timesPlayed)
function getMostPlayed(state: State, limit?: number): HistoryEntry[]

// Get recently played songs (sorted by lastPlayed)
function getRecentlyPlayed(state: State, limit?: number): HistoryEntry[]
```

### 2. Update the player (refactored modules)

`src/player/player.ts` is now a small composition root. The playback lifecycle is split across:

- `src/player/player.audio.ts` – audio adapter (`createPlayerAudio`) and audio event subscriptions
- `src/player/player.state.ts` – state listeners (`wirePlayerState`) that load tracks/handle sections
- `src/player/player.next.ts` – progression logic (`handleEnded`)

Track playback by wiring history at the same level where audio and state meet (recommended: in `src/player/player.ts`, or in a small helper module like `src/player/player.history.ts`).

#### Suggested wiring (works with the refactor)

- On `audio.onPlay`: store `playStartTime = Date.now()` (if there is an active song)
- On `audio.onPause`: compute `duration = (Date.now() - playStartTime) / 1000` and call `updateHistory(state, songId, duration)`
- On **natural** `audio.onEnded`: flush duration, then call `incrementTimesPlayed(state, songId)`
- On track change (`state.addListener('currentTrack', ...)`): flush duration for the previous track before switching the active song id

#### Important nuance: “ended” vs section-end

Section playback ends are triggered from `src/player/player.state.ts` (it calls the same progression callback when `time >= section.endTime`).

For history:

- Count **duration played** for sections (flushing on pause/track change is enough).
- Only increment `timesPlayed` on **natural track end** (`audio.onEnded`), or on a threshold you define (e.g. >30 seconds) — but do not treat “section end” as a full play unless you explicitly want that.

## Files

| File | Action |
|------|--------|
| `src/types.ts` | Add `HistoryEntry`, update `StateBase` |
| `src/history/history-manager.ts` | Create history functions |
| `src/player/player.ts` | Wire history tracking (composition root) |
| `src/player/player.audio.ts` | Source of audio events (`play`/`pause`/`ended`) |
| `src/player/player.state.ts` | Source of track changes + section-end progression |
