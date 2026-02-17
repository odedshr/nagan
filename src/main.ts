import SongDatabase from './song-database/SongDatabase';
import PlaylistManager from './playlist-manager/playlist-manager';
import Player from './player/player';
import { Context } from './Context';
import { Mode, RepeatMode, State } from './types';
import isTauri from './is-tauri';
import { BackendService, getBackendService } from './backend/backend';
import initNotifications from './ui-components/notification/notification';
import { persist, loadPersistedState } from './PersistedState';
import { applyTheme } from './themes/theme';
import NavButtons from './nav';

function initNav(state: State) {
  const form = document.getElementById('nav') as HTMLFormElement;
  form.appendChild(NavButtons());
  form.onsubmit = (e: SubmitEvent) => {
    e.preventDefault(); // Prevent form submission
    state.mode = (e.submitter as HTMLButtonElement).value as Mode;
  };
}

async function init() {
  // Define default state values for persistence
  const defaultState = {
    volume: 100,
    playbackRate: 100,
    repeat: 'none' as RepeatMode,
    currentPlaylistId: null as string | null,
    mode: 'database' as Mode,
    currentTrack: null,
    // DB
    db: [],
    dbFilterArtist: null,
    playlists: [],
    currentPlaylist: null,
    playlistSongs: [],
    // Queue system
    queue: [],
    currentSection: null,
    history: [],
    cssTheme: 'default',
  };

  const state = Context(loadPersistedState(defaultState)) as State;

  // Set up persistence with debounced save on key changes
  persist(state, ['volume', 'playbackRate', 'repeat', 'mode', 'currentPlaylistId', 'queue', 'history', 'cssTheme']);

  state.compute('currentPlaylist', state => state.playlists.find(pl => pl.id === state.currentPlaylistId) || null);

  applyTheme(state);

  const backendService: BackendService = await getBackendService();
  const songDatabase = SongDatabase(state, backendService);
  const playlistManager = PlaylistManager(state, backendService);

  const container = document.getElementById('container') as HTMLElement;
  container.setAttribute('data-mode', state.mode);
  container.appendChild(songDatabase);
  container.appendChild(playlistManager);

  state.addListener('mode', async (mode: string) => container.setAttribute('data-mode', mode));

  initNav(state);
  document.getElementById('player-container')!.appendChild(Player(state));
  initNotifications(state, document.getElementById('notifications') as HTMLUListElement);

  (await import(isTauri() ? './drag-and-drop.tauri.ts' : './drag-and-drop.ts')).default(state);
}

window.addEventListener('DOMContentLoaded', init);
