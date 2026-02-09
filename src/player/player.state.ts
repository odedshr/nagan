import type { State, Song, Section } from '../types.ts';
import type { PlayerAudio } from './player.audio.ts';
import type { PlayerElements } from './player.elements.ts';
import { renderTrackMetadata } from './player.dom.ts';

export function wirePlayerState(
  state: State,
  deps: {
    audio: PlayerAudio;
    elms: PlayerElements;
    loadFile: (path: string) => Promise<File>;
    onEnded: () => void;
    setDuration: (durationSeconds: number) => void;
  }
): () => void {
  const onLastEvent = (event?: CustomEvent) => {
    if (!event) return;
    if (event.type === 'next-song') {
      deps.onEnded();
    }
  };

  const onVolume = (value: number) => deps.audio.setVolume01(value / 100);
  const onPlaybackRate = (value: number) => deps.audio.setPlaybackRate(value / 100);

  const onCurrentTrack = async (song: Song | null) => {
    if (!song) return;

    deps.setDuration(song.metadata.duration);
    deps.audio.setSourceFromFile(await deps.loadFile(song.url));
    renderTrackMetadata(deps.elms, song.metadata);
    await deps.audio.play();
  };

  let unSubSectionTimeUpdate: (() => void) | null = null;
  const onCurrentSection = (section: Section | null) => {
    if (unSubSectionTimeUpdate) {
      unSubSectionTimeUpdate();
      unSubSectionTimeUpdate = null;
    }

    if (!section) return;

    deps.audio.seek(section.startTime);

    unSubSectionTimeUpdate = deps.audio.onTimeUpdate(time => {
      if (time >= section.endTime) {
        if (unSubSectionTimeUpdate) {
          unSubSectionTimeUpdate();
          unSubSectionTimeUpdate = null;
        }
        deps.onEnded();
      }
    });
  };

  const onQueue = (queue: unknown[]) => {
    deps.elms.nextBtn.disabled = queue.length === 0;
  };

  state.addListener('lastEvent', onLastEvent);
  state.addListener('volume', onVolume);
  state.addListener('playbackRate', onPlaybackRate);
  state.addListener('currentTrack', onCurrentTrack);
  state.addListener('currentSection', onCurrentSection);
  state.addListener('queue', onQueue);

  return () => {
    if (unSubSectionTimeUpdate) {
      unSubSectionTimeUpdate();
      unSubSectionTimeUpdate = null;
    }

    state.removeListener('lastEvent', onLastEvent);
    state.removeListener('volume', onVolume);
    state.removeListener('playbackRate', onPlaybackRate);
    state.removeListener('currentTrack', onCurrentTrack);
    state.removeListener('currentSection', onCurrentSection);
    state.removeListener('queue', onQueue);
  };
}
