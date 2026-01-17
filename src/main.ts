import SongDatabase from "./song-database/SongDatabase";
import PlaylistManager from "./playlist-manager/playlist-manager";
import initPlayer from "./player/player";
import { Context } from "./Context";
import { BackendService, Mode, State } from "./types";
import isTauri from "./is-tauri";

function initNav(state: State) {
  [...document.getElementsByClassName("nav-button")].forEach((btn) => {
    btn.addEventListener("click", () => {
      state.mode = (btn as HTMLButtonElement).value as Mode;
    });
  });
}

async function getBackendService() {
  const backendServiceModule =  await import(
    isTauri() ? "./backend/tauri.backend.ts" : "./backend/web.backend.ts"
  );
  return new backendServiceModule.default() as BackendService;
}

window.addEventListener("DOMContentLoaded", async () => {
  const state = Context({
    mode: "database",
    currentTrack: null,
    playbackRate: 100,
    volume: 100,
    db: [],
    playlists: [],
    currentPlaylistId: null,
    currentPlaylist: null,
    playlistSongs: [],
  }) as State;
  state.compute("currentPlaylist",
    (state) => state.playlists
      .find(pl => pl.id === state.currentPlaylistId) || null);

  const backendService:BackendService = await getBackendService()
  const songDatabase = SongDatabase(state, backendService);
  const playlistManager = PlaylistManager(state, backendService);
  
  const container = document.getElementById("container") as HTMLElement;
  container.appendChild(songDatabase);
  state.addListener("mode", async (mode:string) => {
    while (container.hasChildNodes()) { container.removeChild(container.lastChild!); }
    switch (mode) {
      case "database":
        container.appendChild(songDatabase);
        break;
      case "playlist":
        container.appendChild(playlistManager);
        break;
      case "notes":
        console.log("Switched to Notes view");
        break;
    }
  });

  initNav(state);
  initPlayer(state, document.getElementById("player-container") as HTMLElement);
  
  (await import(
    isTauri() ? "./drag-and-drop.tauri.ts" : "./drag-and-drop.ts"
  )).default(state);
});
