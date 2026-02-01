import { State, StateBase } from './types';

const STORAGE_KEY = 'nagan-state';
const SAVE_DEBOUNCE_MS = 1000;

export function loadPersistedState<T>(defaultState: T): T {
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
    timeout = setTimeout(fn, ms) as unknown as number;
  };
}

/**
 * Initialize state persistence.
 * @param state - The application state object
 * @param keysToTriggerSave - Keys to watch for changes. If empty/undefined, saves on beforeunload only.
 * @returns Initial state merged with persisted values
 */
export function persist<T extends Partial<StateBase>>(
  state: State,
  keysToTriggerSave?: (keyof T)[]
): void {
  if (!keysToTriggerSave?.length) {
    // No keys specified: save only on page unload
    window.addEventListener('beforeunload', () => saveState(state as unknown as T, Object.keys(state) as (keyof T)[]));
  } else {
    // Keys specified: debounced save on each key change
    const debouncedSave = debounce(() => saveState(state as unknown as T, keysToTriggerSave), SAVE_DEBOUNCE_MS);
    keysToTriggerSave.forEach(key => state.addListener(key as keyof StateBase, debouncedSave));
  }
}
