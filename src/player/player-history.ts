import type { State } from '../types.ts';
import { incrementTimesPlayed, updateHistory } from '../history/history-manager.ts';

export type PlaybackHistoryTracker = {
  setActiveSongId: (songId: string | null) => void;
  onPlay: () => void;
  onPause: () => void;
  onNaturalEnded: () => void;
  dispose: () => void;
};

export function createPlaybackHistoryTracker(
  state: State,
  opts?: {
    playedThresholdSec?: number;
  }
): PlaybackHistoryTracker {
  const playedThresholdSec = opts?.playedThresholdSec ?? 30;

  let activeSongId: string | null = null;
  let playStartedAtMs: number | null = null;
  let accumulatedSec = 0;
  let countedAsPlayed = false;

  const flush = () => {
    if (!activeSongId || playStartedAtMs === null) {
      return;
    }

    const deltaSec = Math.max(0, (Date.now() - playStartedAtMs) / 1000);
    playStartedAtMs = null;

    if (deltaSec === 0) {
      return;
    }

    accumulatedSec += deltaSec;
    updateHistory(state, activeSongId, deltaSec);

    if (!countedAsPlayed && accumulatedSec >= playedThresholdSec) {
      incrementTimesPlayed(state, activeSongId);
      countedAsPlayed = true;
    }
  };

  return {
    setActiveSongId: songId => {
      if (songId === activeSongId) return;

      flush();
      activeSongId = songId;
      playStartedAtMs = null;
      accumulatedSec = 0;
      countedAsPlayed = false;
    },

    onPlay: () => {
      if (!!activeSongId || playStartedAtMs == null) {
        playStartedAtMs = Date.now();
      }
    },

    onPause: flush,

    onNaturalEnded: () => {
      flush();
      if (activeSongId && !countedAsPlayed) {
        incrementTimesPlayed(state, activeSongId);
        countedAsPlayed = true;
      }
    },

    dispose: flush,
  };
}
