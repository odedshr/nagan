import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./player/player', () => {
  return {
    default: vi.fn(() => {
      const elm = document.createElement('div');
      elm.id = 'player-mock';
      return elm;
    }),
  };
});

vi.mock('./backend/backend', () => {
  return {
    getBackendService: vi.fn(async () => {
      return {};
    }),
  };
});

vi.mock('./song-database/SongDatabase', () => {
  return {
    default: vi.fn(() => {
      const elm = document.createElement('section');
      elm.id = 'song-database-mock';
      return elm;
    }),
  };
});

vi.mock('./playlist-manager/playlist-manager', () => {
  return {
    default: vi.fn(() => {
      const elm = document.createElement('section');
      elm.id = 'playlist-manager-mock';
      return elm;
    }),
  };
});

vi.mock('./ui-components/notification/notification', () => {
  return {
    default: vi.fn(() => undefined),
  };
});

vi.mock('./drag-and-drop.ts', () => {
  return {
    default: vi.fn(() => undefined),
  };
});

vi.mock('./drag-and-drop.tauri.ts', () => {
  return {
    default: vi.fn(() => undefined),
  };
});

vi.mock('./nav', () => {
  return {
    default: vi.fn(() => {
      const frag = document.createDocumentFragment();

      const db = document.createElement('button');
      db.type = 'submit';
      db.value = 'database';
      db.textContent = 'Database';

      const pl = document.createElement('button');
      pl.type = 'submit';
      pl.value = 'playlists';
      pl.textContent = 'Playlists';

      frag.appendChild(db);
      frag.appendChild(pl);
      return frag;
    }),
  };
});

import { initApp } from './main';

beforeEach(() => {
  document.body.innerHTML = `
    <main id="container" class="container"></main>
    <form id="nav"></form>
    <footer id="player-container"></footer>
    <ul id="notifications" class="notifications"></ul>
  `;
});

describe('main.ts', () => {
  it('mounts app and sets initial mode attribute', async () => {
    await initApp();

    const container = document.getElementById('container');
    expect(container).toBeTruthy();
    expect(container?.getAttribute('data-mode')).toBe('database');

    expect(document.getElementById('song-database-mock')).toBeTruthy();
    expect(document.getElementById('playlist-manager-mock')).toBeTruthy();
    expect(document.getElementById('player-mock')).toBeTruthy();
  });

  it('switches mode via nav submit and updates container attribute', async () => {
    await initApp();

    const container = document.getElementById('container')!;
    const form = document.getElementById('nav') as HTMLFormElement;

    const playlistButton = form.querySelector('button[value="playlists"]') as HTMLButtonElement;

    // jsdom support for SubmitEvent.submitter can vary; call handler directly.
    form.onsubmit?.({
      preventDefault: () => undefined,
      submitter: playlistButton,
    } as unknown as SubmitEvent);

    expect(container.getAttribute('data-mode')).toBe('playlists');
  });
});
