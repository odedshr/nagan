/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';

import { Player, TrackMetadata } from '../types.ts';

function browseFile(fileSelectedHandler: (file: File) => void) {
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

function setProgress(newValue:number, trackMetaData: TrackMetadata, positionUpdateHandler: (time: number) => void) {
    const newTime = (newValue / 100) * trackMetaData.duration;
    positionUpdateHandler(newTime);
}

function prettyTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

let fileSelectedHandler: (file: File) => void;
let audioToggleHandler: (isPlaying: boolean) => void;
let positionUpdateHandler: (time: number) => void;
let trackMetaData:TrackMetadata;


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

function initComponents(loadBtn: HTMLButtonElement, playToggleBtn: HTMLButtonElement, progressBar: HTMLInputElement) {
        loadBtn.addEventListener("click", () => browseFile(fileSelectedHandler));
        playToggleBtn.addEventListener("click", () => togglePlay(audioToggleHandler));

        progressBar.addEventListener("change", () => setProgress(parseFloat(progressBar.value), trackMetaData, positionUpdateHandler));
        progressBar.addEventListener("mousedown", () => progressBar.setAttribute("data-dragging", "true"));
        progressBar.addEventListener("mouseup", () => progressBar.removeAttribute("data-dragging"));
}

const elms = new Map<string, HTMLElement>();
const player:Player = {
    setMetadata: (data: TrackMetadata) => setMetadata( data,
        elms.get("title") as HTMLSpanElement,
        elms.get("artist") as HTMLSpanElement,
        elms.get("cover") as HTMLImageElement,
        elms.get("duration") as HTMLSpanElement,
        elms.get("position") as HTMLInputElement,
        elms.get("progressBar") as HTMLInputElement
    ),

    setCurrentTime: (time: number) => setCurrentTime(time,
        elms.get("position") as HTMLInputElement,
        elms.get("progressBar") as HTMLInputElement
    ),

    setFileSelectedHandler(handler: (file: File) => void) { fileSelectedHandler = handler; },
    setAudioToggleHandler(handler: (isPlaying: boolean) => void) { audioToggleHandler = handler; },
    setPositionUpdateHandler(handler: (time: number) => void) { positionUpdateHandler = handler; },
    getDivElement() {
        const div =  (
            <div class="mini-player">
                <div class="track-info">
                    <img id="cover" class="cover" src="" alt="Cover Art"/>
                    <div class="text-info">
                        <span id="title" class="title">Title</span>
                        <span id="artist" class="artist">Artist</span>
                        <input id="position" type="time" class="position" value="00:00" />
                        <span id="duration" class="duration">00:00</span>
                    </div>
                </div>
                <input disabled id="progressBar" type="range" class="progress-bar" min="0" max="100" value="0" />
                <nav>
                    <button class="player-button" id="loadBtn"><span>Load</span></button>
                    <button class="player-button" id="previousBtn" disabled><span>Previous</span></button>
                    <button class="player-button" id="playToggle" value="play"><span>Play</span></button>
                    <button class="player-button" id="nextBtn" disabled><span>Next</span></button>
                    <button class="player-button" id="shuffleBtn"><span>Shuffle</span></button>
                </nav>
            </div>) as HTMLDivElement;

        elms.clear();
        div.querySelectorAll<HTMLElement>("[id]").forEach(el => elms.set(el.id, el));
        
        initComponents(
            elms.get("loadBtn") as HTMLButtonElement,
            elms.get("playToggle") as HTMLButtonElement,
            elms.get("progressBar") as HTMLInputElement
        );
        
        return div;
    } 
}

export default player;