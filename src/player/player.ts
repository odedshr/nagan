import { parseBlob } from "music-metadata";
import PlayerUi from "./Player.ui.js";

import { State, TrackMetadata } from '../types.ts';

function browseFile(fileSelectedHandler: (file: File) => void) {
    console.log("browseFile called");
    const fileSelect = document.createElement('input');
    fileSelect.type = 'file';
    fileSelect.accept = 'audio/*';
    fileSelect.style.display = 'none';
    fileSelect.addEventListener("change", async () => {
        if (fileSelect.files !== null && fileSelect.files.length > 0) {
            fileSelectedHandler(fileSelect.files[0])
        }
    });
    fileSelect.click(); // Programmatically open the file dialog
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

function setMetadata(data: TrackMetadata,
    titleEl: HTMLSpanElement,
    artistEl: HTMLSpanElement,
    coverEl: HTMLImageElement,
    durationEl: HTMLSpanElement,
    positionEl: HTMLInputElement,
    progressBar: HTMLInputElement) {
        trackMetaData = data;
        titleEl.textContent = data.title || "Unknown Title";
        artistEl.textContent = data.artist || "Unknown Artist";
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
    positionEl.value = prettyTime(time);
    
    if (!progressBar.hasAttribute("data-dragging") && trackMetaData.duration) {
        const progress = (time / trackMetaData.duration) * 100;
        progressBar.value = progress.toString();
    }
}

function setProgress(newValue:number, trackMetaData: TrackMetadata, positionUpdateHandler: (time: number) => void) {
    const newTime = (newValue / 100) * trackMetaData.duration;
    positionUpdateHandler(newTime);
}

function prettyTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function initComponents(loadBtn: HTMLButtonElement,
    playToggleBtn: HTMLButtonElement,
    progressBar: HTMLInputElement) {
      loadBtn.addEventListener("click", () => browseFile(fileSelectedHandler));
      playToggleBtn.addEventListener("click", () => togglePlay(audioToggleHandler));

      progressBar.addEventListener("change", () => setProgress(parseFloat(progressBar.value), trackMetaData, positionUpdateHandler));
      progressBar.addEventListener("mousedown", () => progressBar.setAttribute("data-dragging", "true"));
      progressBar.addEventListener("mouseup", () => progressBar.removeAttribute("data-dragging"));
}

const elms = new Map<string, HTMLElement>();
let fileSelectedHandler: (file: File) => void;
let audioToggleHandler: (isPlaying: boolean) => void;
let positionUpdateHandler: (time: number) => void;

let trackMetaData:TrackMetadata;

export default function initPlayer(state:State, container:HTMLElement) {
  const audio = new Audio();
  fileSelectedHandler = (async (file: File) => {
    const metadata = await parseBlob(file);
    
    setMetadata({
        title: metadata.common.title || "Unknown Title",
        artist: metadata.common.artist || "Unknown Artist",
        picture: metadata.common.picture || [],
        duration: metadata.format.duration || 0,
      },
        elms.get("title") as HTMLSpanElement,
        elms.get("artist") as HTMLSpanElement,
        elms.get("cover") as HTMLImageElement,
        elms.get("duration") as HTMLSpanElement,
        elms.get("position") as HTMLInputElement,
        elms.get("progressBar") as HTMLInputElement
    )

    // load file to audio element or player here
    audio.src = URL.createObjectURL(file);
    // when the audio is playing, log the current time every second
    audio.addEventListener("timeupdate", () => setCurrentTime(
        audio.currentTime,
        elms.get("position") as HTMLInputElement,
        elms.get("progressBar") as HTMLInputElement));
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
      elms.get("progressBar") as HTMLInputElement
  );

  state.addListener("volume", (value:number) => audio.volume = value / 100);
  state.addListener("playbackRate", (value:number) => console.log('>>', value )); //audio.playbackRate = value / 100);

  container.appendChild(div);
};