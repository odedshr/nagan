import PlayerUi from "./Player.ui.js";

import { Song, SongMetadata, State, } from '../types.ts';
import selectFile from "./files/select-file.ts";
import extractSongMetadata from "./extract-song-metadata.ts";
import loadFile from "./files/load-file.ts";
import { prettyTime } from "../formatters.ts";

async function browseFile(fileSelectedHandler: (file: File) => void) {
    const files = await selectFile();
    if (files.length > 0) {
        fileSelectedHandler(files[0]);
    }
}

function togglePlay(audioToggleHandler: (isPlaying: boolean) => void) {
    const audioToggleBtn = document.getElementById("playToggle") as HTMLButtonElement;
    if (audioToggleBtn.value === "play") {
        audioToggleBtn.value = "pause";
        audioToggleBtn.querySelector("span")!.textContent = "Pause";
        audioToggleHandler(true);
    } else {
        audioToggleBtn.value = "play";
        audioToggleBtn.querySelector("span")!.textContent = "Play";
        audioToggleHandler(false);
    }
}

function displaySongMetaData(data: SongMetadata) {
    const titleEl = elms.get("title") as HTMLSpanElement;
    const artistEl = elms.get("artist") as HTMLSpanElement;
    const coverEl = elms.get("cover") as HTMLImageElement;
    const durationEl = elms.get("duration") as HTMLSpanElement;
    const positionEl = elms.get("position") as HTMLInputElement;
    const progressBar = elms.get("progressBar") as HTMLInputElement;
        trackMetaData = data;
        titleEl.textContent = data.title;
        artistEl.textContent = Array.isArray(data.artists) ? data.artists.join(", ") : data.artists || "Unknown Artist";
        const cover = data.picture && data.picture.length > 0 ? data.picture[0] : null;
        if (cover) {
            const blob = new Blob([new Uint8Array(cover.data)], { type: cover.format });
            const url = URL.createObjectURL(blob);
            coverEl.src = url;
        } else {
            coverEl.src = "";
        }

        positionEl.value = "00:00";
        positionEl.max = data.duration ? Math.floor(data.duration).toString() : "0";
        durationEl.textContent = prettyTime(data.duration);
        progressBar.disabled = false;
    }

function setCurrentTime(time: number, positionEl: HTMLInputElement, progressBar: HTMLInputElement) {  
    progressBar.setAttribute("style", `--progress: ${ (time / trackMetaData.duration) * 100 }%`);
    if (!progressBar.hasAttribute("data-dragging") && trackMetaData.duration) {
        const progress = (time / trackMetaData.duration) * 100;
        progressBar.value = progress.toString();
    }
    if (document.activeElement !== positionEl) {
        positionEl.value = prettyTime(time);
    }
}

function setProgress(newValue:number, trackMetaData: SongMetadata, positionUpdateHandler: (time: number) => void) {
    const newTime = (newValue / 100) * trackMetaData.duration;
    positionUpdateHandler(newTime);
}

const VALID_TIME_REGEX = /^(?:\d+|(?:\d+:[0-5]\d)|(?:\d+:[0-5]\d:[0-5]\d))$/;

function validatePositionInput(value: string, duration: number, positionUpdateHandler: (time: number) => void) {
    if (!VALID_TIME_REGEX.test(value)) {
        return false;
    }

    let totalSeconds =  value.split(':')
        .map(Number)
        .reduce((acc, part) => acc * 60 + part, 0);
    
    if (totalSeconds <= duration) {
        positionUpdateHandler(totalSeconds);
    }
}

function initComponents(
    loadBtn: HTMLButtonElement,
    playToggleBtn: HTMLButtonElement,
    progressBar: HTMLInputElement,
    positionEl: HTMLInputElement) {
      loadBtn.addEventListener("click", () => browseFile(fileSelectedHandler));
      playToggleBtn.addEventListener("click", () => togglePlay(audioToggleHandler));

      progressBar.addEventListener("change", () => setProgress(parseFloat(progressBar.value), trackMetaData, positionUpdateHandler));
      progressBar.addEventListener("mousedown", () => progressBar.setAttribute("data-dragging", "true"));
      progressBar.addEventListener("mouseup", () => progressBar.removeAttribute("data-dragging"));
      positionEl.addEventListener("change", () => validatePositionInput(positionEl.value, trackMetaData.duration, positionUpdateHandler));
}

const elms = new Map<string, HTMLElement>();
let fileSelectedHandler: (file: File) => void;
let audioToggleHandler: (isPlaying: boolean) => void;
let positionUpdateHandler: (time: number) => void;

let trackMetaData:SongMetadata;

export default function initPlayer(state:State, container:HTMLElement) {
    const audio = new Audio();
    // when the audio is playing, log the current time every second
    audio.addEventListener("timeupdate", () => setCurrentTime(
        audio.currentTime,
        elms.get("position") as HTMLInputElement,
        elms.get("progressBar") as HTMLInputElement));

    fileSelectedHandler = (async (file: File) => {
    const metadata = await extractSongMetadata(file);
    
    displaySongMetaData(metadata);

    // load file to audio element or player here
    audio.src = URL.createObjectURL(file);
    state.lastEvent = new CustomEvent('file-loaded', { detail: { file, metadata } });
  });

  audioToggleHandler = ((isPlaying: boolean) => {
    if (isPlaying) {
      audio.play();
    } else {
      audio.pause();
    }
  });

  positionUpdateHandler = ((time: number) => {
    audio.currentTime = time;
    setCurrentTime(time,
      elms.get("position") as HTMLInputElement,
      elms.get("progressBar") as HTMLInputElement
    );
  });

//   speedUpdateHandler = ((speed: number) => {
//     audio.playbackRate = speed;
//   });

  const div: HTMLDivElement = PlayerUi(state);
  elms.clear();
  div.querySelectorAll<HTMLElement>("[id]").forEach(el => elms.set(el.id, el));
  
  initComponents(
      elms.get("loadBtn") as HTMLButtonElement,
      elms.get("playToggle") as HTMLButtonElement,
      elms.get("progressBar") as HTMLInputElement,
      elms.get("position") as HTMLInputElement
  );

  state.addListener("volume", (value:number) => audio.volume = value / 100);
  state.addListener("playbackRate", (value:number) => audio.playbackRate = value / 100);
  state.addListener("currentTrack", async (song:Song|null) => {
    if (song) {
      console.log("Playing song:", song.url);
      audio.src = URL.createObjectURL(await loadFile(song.url));
      console.log("Song metadata:", song.metadata);
      displaySongMetaData(song.metadata);
    //   audio.play();
      console.log('playing');
    //   const playToggleBtn = elms.get("playToggle") as HTMLButtonElement;
    //   playToggleBtn.value = "pause";
    //   playToggleBtn.querySelector("span")!.textContent = "Pause";
    }
  });

  container.appendChild(div);
};