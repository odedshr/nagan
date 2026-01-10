import { invoke } from "@tauri-apps/api/core";
import SongDatabase from "./song-database/SongDatabase";
import initPlaylist from "./playlist-manager/Playlist";
import initPlayer from "./player/player";
import { Context } from "./Context";
import { BackendService, Mode, State } from "./types";
import isTauri from "./is-tauri";

let greetInputEl: HTMLInputElement | null;
let greetMsgEl: HTMLElement | null;



async function greet() {
  if (greetMsgEl && greetInputEl) {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    greetMsgEl.textContent = await invoke("greet", {
      name: greetInputEl.value,
    });
  }
}

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
  const state = Context({ mode: "database", current: null, playbackRate: 100, volume: 100 }) as State;

  const backendService:BackendService = await getBackendService()
  const songDatabase = SongDatabase(state, backendService);

  state.addListener("mode", async (mode:string) => {
    const container = document.getElementById("container") as HTMLElement;
    while (container.hasChildNodes()) { container.removeChild(container.lastChild!); }
    switch (mode) {
      case "database":
        container.appendChild(songDatabase);
        break;
      case "playlist":
        initPlaylist(container);
        break;
      case "notes":
        console.log("Switched to Notes view");
        break;
    }
  });

  initNav(state);
  initPlayer(state, document.getElementById("player-container") as HTMLElement);
  
  const dragAndDropModule = isTauri() ? await import("./drag-and-drop.tauri.ts") : await import("./drag-and-drop.ts")
  dragAndDropModule.default(state);
  

  greetInputEl = document.querySelector("#greet-input");
  greetMsgEl = document.querySelector("#greet-msg");
  document.querySelector("#greet-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    greet();
  });
});
