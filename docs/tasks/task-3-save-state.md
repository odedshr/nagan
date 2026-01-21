# Task 3: Implement State Persistence

## Overview

Persist application state to `localStorage` for session recovery.

## Implementation

### Create `src/PersistedState.ts`

```typescript
import { State, StateBase } from './types';

const STORAGE_KEY = 'nagan-state';
const SAVE_DEBOUNCE_MS = 1000;

function loadPersistedState<T>(defaultState: T): T {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;
  } catch {
    return defaultState;
  }
}

function saveState<T>(state: T, keys: (keyof T)[]): void {
  const toSave = keys.reduce((acc, key) => {
    acc[key] = state[key];
    return acc;
  }, {} as Partial<T>);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

function debounce(fn: () => void, ms: number): () => void {
  let timeout: number;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(fn, ms);
  };
}

/**
 * Initialize state persistence.
 * @param state - The application state object
 * @param defaultState - Default state values
 * @param keysToTriggerSave - Keys to watch for changes. If empty/undefined, saves on beforeunload only.
 * @returns Initial state merged with persisted values
 */
export default function persist<T extends object>(
  state: State,
  defaultState: T,
  keysToTriggerSave?: (keyof T)[]
): T {
  const keysToSave = keysToTriggerSave?.length ? keysToTriggerSave : Object.keys(defaultState) as (keyof T)[];
  const initialState = loadPersistedState(defaultState);

  if (!keysToTriggerSave?.length) {
    // No keys specified: save only on page unload
    window.addEventListener('beforeunload', () => saveState(state, keysToSave));
  } else {
    // Keys specified: debounced save on each key change
    const debouncedSave = debounce(() => saveState(state, keysToSave), SAVE_DEBOUNCE_MS);
    keysToTriggerSave.forEach(key => {
      state.addListener(key as string, debouncedSave);
    });
  }

  return initialState;
}
```

### Usage in `src/main.ts`

```typescript
import { persist } from './PersistedState';

const defaultState = {
  volume: 100,
  playbackRate: 100,
  repeat: 'none',
  currentPlaylistId: null,
  mode: 'database',
};

// Option 1: Save on specific key changes (debounced)
const initialState = persist(state, defaultState, ['volume', 'playbackRate', 'repeat', 'mode']);

// Option 2: Save only on beforeunload
const initialState = persist(state, defaultState);
```

## Files

| File | Action |
|------|--------|
| `src/PersistedState.ts` | Create - persistence manager |
| `src/main.ts` | Call `persist()` on init |

## Notes

- Don't persist `currentTrack` (file URLs are ephemeral) or `db`/`playlists` (loaded from backend)
- Debounce prevents excessive writes during rapid changes (e.g., volume slider)
