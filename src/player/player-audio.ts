export type PlayerAudio = {
  element: HTMLAudioElement;
  isPaused: () => boolean;
  play: () => Promise<void>;
  pause: () => void;
  seek: (timeSeconds: number) => void;
  setVolume01: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  setSourceFromFile: (file: File) => void;
  onTimeUpdate: (fn: (timeSeconds: number) => void) => () => void;
  onEnded: (fn: () => void) => () => void;
  onPlay: (fn: () => void) => () => void;
  onPause: (fn: () => void) => () => void;
  dispose: () => void;
};

export function createPlayerAudio(): PlayerAudio {
  const element = new Audio();
  let currentObjectUrl: string | null = null;

  const add = <K extends keyof HTMLMediaElementEventMap>(
    type: K,
    fn: (ev: HTMLMediaElementEventMap[K]) => void
  ): (() => void) => {
    element.addEventListener(type, fn as EventListener);
    return () => element.removeEventListener(type, fn as EventListener);
  };

  const revokeObjectUrl = () => {
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }
  };

  return {
    element,
    isPaused: () => element.paused,
    play: () => element.play(),
    pause: () => element.pause(),
    seek: (timeSeconds: number) => {
      element.currentTime = timeSeconds;
    },
    setVolume01: (volume: number) => {
      element.volume = volume;
    },
    setPlaybackRate: (rate: number) => {
      element.playbackRate = rate;
    },
    setSourceFromFile: (file: File) => {
      revokeObjectUrl();
      currentObjectUrl = URL.createObjectURL(file);
      element.src = currentObjectUrl;
    },
    onTimeUpdate: fn => add('timeupdate', () => fn(element.currentTime)),
    onEnded: fn => add('ended', () => fn()),
    onPlay: fn => add('play', () => fn()),
    onPause: fn => add('pause', () => fn()),
    dispose: () => {
      revokeObjectUrl();
      element.pause();
      element.src = '';
    },
  };
}
