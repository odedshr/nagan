import { HistoryEntry, State } from '../types';

export function getHistoryEntry(state: State, songId: string): HistoryEntry | undefined {
  return state.history.find(entry => entry.songId === songId);
}

export function updateHistory(state: State, songId: string, duration: number): void {
  const safeDuration = Number.isFinite(duration) ? Math.max(0, duration) : 0;
  const now = Date.now();

  const existing = getHistoryEntry(state, songId);
  if (!existing) {
    state.history = [
      ...state.history,
      {
        songId,
        durationPlayed: safeDuration,
        timesPlayed: 0,
        lastPlayed: now,
      },
    ];

    return;
  }

  const updated: HistoryEntry = {
    ...existing,
    durationPlayed: existing.durationPlayed + safeDuration,
    lastPlayed: now,
  };

  state.history = state.history.map(entry => (entry.songId === songId ? updated : entry));
}

export function incrementTimesPlayed(state: State, songId: string): void {
  const now = Date.now();
  const existing = getHistoryEntry(state, songId);
  if (!existing) {
    state.history = [
      ...state.history,
      {
        songId,
        durationPlayed: 0,
        timesPlayed: 1,
        lastPlayed: now,
      },
    ];
    return;
  }

  const updated: HistoryEntry = {
    ...existing,
    timesPlayed: existing.timesPlayed + 1,
    lastPlayed: now,
  };

  state.history = state.history.map(entry => (entry.songId === songId ? updated : entry));
}

export function clearHistory(state: State): void {
  state.history = [];
}

export function getMostPlayed(state: State, limit?: number): HistoryEntry[] {
  const sorted = [...state.history].sort((a, b) => b.timesPlayed - a.timesPlayed);
  return typeof limit === 'number' ? sorted.slice(0, Math.max(0, limit)) : sorted;
}

export function getRecentlyPlayed(state: State, limit?: number): HistoryEntry[] {
  const sorted = [...state.history].sort((a, b) => b.lastPlayed - a.lastPlayed);
  return typeof limit === 'number' ? sorted.slice(0, Math.max(0, limit)) : sorted;
}
