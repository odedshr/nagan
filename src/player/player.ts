import PlayerUi from './Player.ui.js';

import { State } from '../types.ts';
import loadFile from '../files/load-file.ts';

import { getPlayerElements } from './player.elements.ts';
import { bindSeekControls, renderCurrentTime, setPlayToggleState } from './player.dom.ts';
import { createPlayerAudio } from './player.audio.ts';
import { handleEnded } from './player.next.ts';
import { wirePlayerState } from './player.state.ts';
import { createPlaybackHistoryTracker } from './player.history.ts';
import type { Song } from '../types.ts';
import RepeatControl from '../queue/repeat-control.tsx';
import Knob from '../ui-components/knob/knob.tsx';

export default function Player(state: State) {
  const form: HTMLFormElement = PlayerUi(
    RepeatControl(state),
    Knob('Playback Rate', state.playbackRate, 50, 200, 5, elm => state.bidi('playbackRate', elm, 'value', 'input')),
    Knob('Volume', state.volume, 0, 100, 5, elm => state.bidi('volume', elm, 'value', 'input'))
  );

  const elms = getPlayerElements(form);
  const audio = createPlayerAudio();

  const history = createPlaybackHistoryTracker(state, { playedThresholdSec: 30 });

  const onTrackForHistory = (song: Song | null) => {
    history.setActiveSongId(song?.id ?? null);
  };
  history.setActiveSongId(state.currentTrack?.id ?? null);
  state.addListener('currentTrack', onTrackForHistory);

  let currentDuration = 0;

  const onEnded = () => handleEnded(state, audio, elms);
  const onNaturalAudioEnded = () => {
    history.onNaturalEnded();
    onEnded();
  };

  const unbindSeek = bindSeekControls(elms, {
    getDuration: () => currentDuration,
    seekTo: timeSeconds => {
      audio.seek(timeSeconds);
      renderCurrentTime(elms, timeSeconds, currentDuration);
    },
  });

  const unSubTime = audio.onTimeUpdate(timeSeconds => renderCurrentTime(elms, timeSeconds, currentDuration));
  const unSubEnded = audio.onEnded(onNaturalAudioEnded);
  const unSubPlay = audio.onPlay(() => {
    history.onPlay();
    setPlayToggleState(elms, true);
  });
  const unSubPause = audio.onPause(() => {
    history.onPause();
    setPlayToggleState(elms, false);
  });

  const disposeState = wirePlayerState(state, {
    audio,
    elms,
    loadFile,
    onEnded,
    setDuration: d => {
      currentDuration = d;
    },
  });

  const dispose = () => {
    history.dispose();
    state.removeListener('currentTrack', onTrackForHistory);
    unbindSeek();
    unSubTime();
    unSubEnded();
    unSubPlay();
    unSubPause();
    disposeState();
    audio.dispose();
  };

  window.addEventListener('beforeunload', dispose);

  form.onsubmit = e => {
    e.preventDefault();
    const submitter = e.submitter as HTMLButtonElement | null;
    if (!submitter) return false;

    switch (submitter.id) {
      case 'playToggle':
        try {
          if (audio.isPaused()) {
            if (!state.currentTrack) {
              onEnded();
            } else {
              void audio.play();
            }
          } else {
            audio.pause();
          }
        } catch (error) {
          console.error('Error toggling playback:', error);
        }
        break;
      case 'nextBtn':
        onEnded();
        break;
    }
    return false;
  };

  return form;
}
