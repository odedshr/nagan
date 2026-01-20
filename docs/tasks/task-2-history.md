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

// Get history entry for a song
function getHistoryEntry(state: State, songId: string): HistoryEntry | undefined

// Clear all history
function clearHistory(state: State): void

// Get most played songs (sorted by timesPlayed)
function getMostPlayed(state: State, limit?: number): HistoryEntry[]

// Get recently played songs (sorted by lastPlayed)
function getRecentlyPlayed(state: State, limit?: number): HistoryEntry[]
```

### 2. Update `src/player/player.ts`

Track playback:
- On `play` event: store `playStartTime = Date.now()`
- On `pause`/`ended`/track change: calculate `duration = (Date.now() - playStartTime) / 1000`
- Call `updateHistory(state, songId, duration)`
- Increment `timesPlayed` only on `ended` event (full play) or threshold (e.g., >30s played)

## Files

| File | Action |
|------|--------|
| `src/types.ts` | Add `HistoryEntry`, update `StateBase` |
| `src/history/history-manager.ts` | Create history functions |
| `src/player/player.ts` | Track duration, update history on events |
