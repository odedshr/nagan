import { invoke } from "@tauri-apps/api/core";
import initSongDatabase from "./song-database/SongDatabase";
import initPlaylist from "./playlist-manager/Playlist";
import initPlayer from "./player/player";

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

window.addEventListener("DOMContentLoaded", () => {
  initSongDatabase(document.getElementById("database-container") as HTMLElement);
  initPlaylist(document.getElementById("playlist-container") as HTMLElement);
  initPlayer(document.getElementById("player-container") as HTMLElement);

  greetInputEl = document.querySelector("#greet-input");
  greetMsgEl = document.querySelector("#greet-msg");
  document.querySelector("#greet-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    greet();
  });
});
