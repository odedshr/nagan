import type { State } from '../types.ts';
import type { PlayerAudio } from './player-audio.ts';
import type { PlayerElements } from './player-elements.ts';
import { dequeue, enqueuePlaylist } from '../queue/queue-manager.ts';
import { setPlayToggleState } from './player-dom.ts';

export function handleEnded(state: State, audio: PlayerAudio, elms: PlayerElements): void {
  const repeat = state.repeat;
  const currentTrack = state.currentTrack;
  const currentSection = state.currentSection;

  if (repeat === 'section' && currentSection) {
    audio.seek(currentSection.startTime);
    void audio.play();
    return;
  }

  if (repeat === 'song' && currentTrack) {
    audio.seek(0);
    void audio.play();
    return;
  }

  if (state.queue.length > 0) {
    playNextFromQueue(state);
    return;
  }

  if (state.currentPlaylistId && state.playlistSongs.length > 0) {
    const currentIndex = state.playlistSongs.findIndex(s => s.id === currentTrack?.id);
    const nextIndex = currentIndex + 1;

    if (nextIndex < state.playlistSongs.length) {
      state.currentSection = null;
      state.currentTrack = state.playlistSongs[nextIndex];
      return;
    }

    if (repeat === 'playlist') {
      enqueuePlaylist(state, state.playlistSongs);
      playNextFromQueue(state);
      return;
    }
  }

  stopPlayback(state, audio, elms);
}

export function playNextFromQueue(state: State): void {
  // Keep consuming until a playable item is found
  while (state.queue.length > 0) {
    const nextItem = dequeue(state);
    if (!nextItem) return;

    switch (nextItem.type) {
      case 'song':
        state.currentSection = null;
        state.currentTrack = nextItem.song;
        return;

      case 'section':
        state.currentSection = nextItem;
        state.currentTrack = nextItem.song;
        return;
    }
  }
}

export function stopPlayback(state: State, audio: PlayerAudio, elms: PlayerElements): void {
  audio.pause();
  setPlayToggleState(elms, false);
  state.currentTrack = null;
  state.currentSection = null;
}
