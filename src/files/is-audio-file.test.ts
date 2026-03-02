import { describe, expect, it } from 'vitest';

import { isAudioFile, isAudioPath } from './is-audio-file.ts';

describe('isAudioPath', () => {
  it('detects common audio extensions (case-insensitive)', () => {
    expect(isAudioPath('/music/track.MP3')).toBe(true);
    expect(isAudioPath('song.flac')).toBe(true);
    expect(isAudioPath('voice.WaV')).toBe(true);
    expect(isAudioPath('video.mp4')).toBe(false);
  });
});

describe('isAudioFile', () => {
  it('returns true for known audio MIME types', () => {
    const file = new File(['x'], 'not-an-audio.ext', { type: 'audio/mpeg' });
    expect(isAudioFile(file)).toBe(true);
  });

  it('falls back to name/path when MIME type is not helpful', () => {
    const file = new File(['x'], 'track.mp3', { type: '' });
    expect(isAudioFile(file)).toBe(true);

    const notAudio = new File(['x'], 'track.txt', { type: '' });
    expect(isAudioFile(notAudio)).toBe(false);
  });

  it('uses Tauri file path when present', () => {
    const tauriLike = {
      name: 'ignored',
      type: '',
      path: '/Users/me/Music/track.ogg',
    } as unknown as File;

    expect(isAudioFile(tauriLike)).toBe(true);
  });

  it('uses webkitRelativePath when present', () => {
    const file = new File(['x'], 'ignored', { type: '' }) as File & { webkitRelativePath?: string };
    file.webkitRelativePath = 'album/track.m4a';
    expect(isAudioFile(file)).toBe(true);
  });
});
