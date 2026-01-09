import { invoke } from "@tauri-apps/api/core";
import initSongDatabase from "./song-database/SongDatabase";
import initPlaylist from "./playlist-manager/Playlist";
import initPlayer from "./player/player";
import { Context } from "./Context";
import { Mode, State } from "./types";
import initDragAndDrop from "./drag-and-drop";

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

window.addEventListener("DOMContentLoaded", () => {
  const state = Context({ mode: "database", current: null, playbackRate: 100, volume: 100 }) as State;
  state.addListener("mode", (mode:string) => {
    const container = document.getElementById("container") as HTMLElement;
    while (container.hasChildNodes()) { container.removeChild(container.lastChild!); }
    switch (mode) {
      case "database":
        initSongDatabase(container);
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
  initDragAndDrop();

  greetInputEl = document.querySelector("#greet-input");
  greetMsgEl = document.querySelector("#greet-msg");
  document.querySelector("#greet-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    greet();
  });
});
