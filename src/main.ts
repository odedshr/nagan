import SongDatabase from './song-database/song-database';
import PlaylistManager from './playlist-manager/playlist-manager';
import Player from './player/player';
import { Context } from './utils/context';
import { Mode, RepeatMode, State } from './types';
import { BackendService, getBackendService } from './backend/backend';
import initNotifications from './ui-components/notification/init-notifications';
import { persist, loadPersistedState } from './utils/persisted-state';
import { applyTheme } from './themes/theme';
import NavButtons from './Nav';
import initFileDragAndDrop from './files/file-drag-and-drop';

function initNav(state: State) {
  const form = document.getElementById('nav') as HTMLFormElement;
  form.appendChild(NavButtons());
  form.onsubmit = (e: SubmitEvent) => {
    e.preventDefault(); // Prevent form submission
    state.mode = (e.submitter as HTMLButtonElement).value as Mode;
  };
}

export async function initApp() {
  // Define default state values for persistence
  const defaultState = {
    volume: 100,
    playbackRate: 100,
    repeat: 'none' as RepeatMode,
    currentPlaylistId: null as string | null,
    mode: 'database' as Mode,
    currentTrack: null,
    // DB
    groupBy: [],
    dbFilters: {},
    dbSort: [],
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

  await initFileDragAndDrop(state);
}

window.addEventListener('DOMContentLoaded', () => void initApp());
