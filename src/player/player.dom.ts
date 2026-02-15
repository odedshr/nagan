import { prettyTime } from '../formatters.ts';
import type { SongMetadata } from '../types.ts';
import type { PlayerElements } from './player.elements.ts';

const VALID_TIME_REGEX = /^(?:\d+|(?:\d+:[0-5]\d)|(?:\d+:[0-5]\d:[0-5]\d))$/;

export function setPlayToggleState(elms: PlayerElements, isPlaying: boolean): void {
  elms.playToggle.value = isPlaying ? 'pause' : 'play';
  const span = elms.playToggle.querySelector('span');
  if (span) {
    span.textContent = isPlaying ? 'Pause' : 'Play';
  }
}

export function renderTrackMetadata(elms: PlayerElements, data: SongMetadata): void {
  elms.title.textContent = data.title;
  elms.artist.textContent = Array.isArray(data.artists) ? data.artists.join(', ') : data.artists || 'Unknown Artist';
  elms.cover.src = data.image || '';

  elms.position.value = '00:00';
  elms.position.max = data.duration ? Math.floor(data.duration).toString() : '0';
  elms.duration.textContent = prettyTime(data.duration);
  elms.progressBar.disabled = false;
  renderCurrentTime(elms, 0, data.duration);
}

export function renderCurrentTime(elms: PlayerElements, time: number, duration: number): void {
  const safeDuration = duration || 0;
  const progressPct = safeDuration > 0 ? (time / safeDuration) * 100 : 0;

  elms.progressBar.setAttribute('style', `--progress: ${progressPct}%`);

  if (!elms.progressBar.hasAttribute('data-dragging') && safeDuration > 0) {
    elms.progressBar.value = progressPct.toString();
  }

  if (document.activeElement !== elms.position) {
    elms.position.value = prettyTime(time);
  }
}

function parseTimeInputToSeconds(value: string): number | null {
  if (!VALID_TIME_REGEX.test(value)) {
    return null;
  }

  const totalSeconds = value
    .split(':')
    .map(Number)
    .reduce((acc, part) => acc * 60 + part, 0);

  return Number.isFinite(totalSeconds) ? totalSeconds : null;
}

export function bindSeekControls(
  elms: PlayerElements,
  deps: {
    getDuration: () => number;
    seekTo: (timeSeconds: number) => void;
  }
): () => void {
  const onProgressChange = () => {
    const duration = deps.getDuration();
    if (!duration) return;
    const pct = parseFloat(elms.progressBar.value);
    if (!Number.isFinite(pct)) return;
    const newTime = (pct / 100) * duration;
    deps.seekTo(newTime);
  };

  const onMouseDown = (event: MouseEvent) => {
    event.preventDefault();
    elms.progressBar.setAttribute('data-dragging', 'true');
    document.body.classList.add('no-text-select');
  };
  const onMouseUp = () => {
    elms.progressBar.removeAttribute('data-dragging');
    document.body.classList.remove('no-text-select');
  };

  const onPositionChange = () => {
    const duration = deps.getDuration();
    if (!duration) return;

    const seconds = parseTimeInputToSeconds(elms.position.value);
    if (seconds === null) return;

    if (seconds <= duration) {
      deps.seekTo(seconds);
    }
  };

  elms.progressBar.addEventListener('change', onProgressChange);
  elms.progressBar.addEventListener('mousedown', onMouseDown);
  elms.progressBar.addEventListener('mouseup', onMouseUp);
  elms.progressBar.addEventListener('mouseleave', onMouseUp);
  elms.position.addEventListener('change', onPositionChange);

  return () => {
    elms.progressBar.removeEventListener('change', onProgressChange);
    elms.progressBar.removeEventListener('mousedown', onMouseDown);
    elms.progressBar.removeEventListener('mouseup', onMouseUp);
    elms.progressBar.removeEventListener('mouseleave', onMouseUp);
    elms.position.removeEventListener('change', onPositionChange);
  };
}
