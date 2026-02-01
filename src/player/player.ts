import PlayerUi from "./Player.ui.js";

import { Song, SongMetadata, State, Section } from '../types.ts';

import loadFile from "../song-database/files/load-file.ts";
import { prettyTime } from "../formatters.ts";
import { dequeue, enqueueSong, enqueuePlaylist } from '../queue/queue-manager.ts';

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
        if (data.image) {
            coverEl.src = data.image;
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
    progressBar: HTMLInputElement,
    positionEl: HTMLInputElement) {
      progressBar.addEventListener("change", () => setProgress(parseFloat(progressBar.value), trackMetaData, positionUpdateHandler));
      progressBar.addEventListener("mousedown", () => progressBar.setAttribute("data-dragging", "true"));
      progressBar.addEventListener("mouseup", () => progressBar.removeAttribute("data-dragging"));
      positionEl.addEventListener("change", () => validatePositionInput(positionEl.value, trackMetaData.duration, positionUpdateHandler));
}

const elms = new Map<string, HTMLElement>();
let positionUpdateHandler: (time: number) => void;

let trackMetaData:SongMetadata;

export default function Player(state:State) {
    const audio = new Audio();
    let sectionEndTimeHandler: (() => void) | null = null;

    // when the audio is playing, log the current time every second
    audio.addEventListener("timeupdate", () => setCurrentTime(
        audio.currentTime,
        elms.get("position") as HTMLInputElement,
        elms.get("progressBar") as HTMLInputElement));

    // Handle song ended event
    audio.addEventListener("ended", () => handleSongEnded(state, audio));

  positionUpdateHandler = ((time: number) => {
    audio.currentTime = time;
    setCurrentTime(time,
      elms.get("position") as HTMLInputElement,
      elms.get("progressBar") as HTMLInputElement
    );
  });

//   speedUpdateHandler = ((speed: number) => {
//     audio.playbackRate = speed;

  const form: HTMLFormElement = PlayerUi(state);
  elms.clear();
  form.querySelectorAll<HTMLElement>("[id]").forEach(el => elms.set(el.id, el));
  form.onsubmit = (e) => {
    e.preventDefault();
    switch ((e.submitter as HTMLButtonElement).id) {
      case "playToggle":
        try {
          if (audio.paused) {
            if (!state.currentTrack) {
              handleSongEnded(state, audio);
            } else {
              audio.play();
            }
          } else {
            audio.pause();
          }
        } catch (error) {
          console.error("Error toggling playback:", error);
        }
        break;
      case "nextBtn":
        handleSongEnded(state, audio);
        break;
    }
    return false;
  }
  
  initComponents(
      elms.get("progressBar") as HTMLInputElement,
      elms.get("position") as HTMLInputElement
  );

    // Handle audio start/stop play
  const playToggleBtn = form.querySelector("#playToggle") as HTMLButtonElement;
  audio.addEventListener("play", () => { playToggleBtn.value = "pause"; });
  audio.addEventListener("pause", () => { playToggleBtn.value = "play"; });
  
  state.addListener("lastEvent", (event?:CustomEvent) => {
    if (event) {
      switch (event.type) {
        case "next-song":
          handleSongEnded(state, audio);
          break;
      }
    }
  });
  state.addListener("volume", (value:number) => audio.volume = value / 100);
  state.addListener("playbackRate", (value:number) => audio.playbackRate = value / 100);
  state.addListener("currentTrack", async (song:Song|null) => {
    if (song) {
      console.log("Playing song:", song.url);
      audio.src = URL.createObjectURL(await loadFile(song.url));
      console.log("Song metadata:", song.metadata);
      displaySongMetaData(song.metadata);
      audio.play();
      const playToggleBtn = elms.get("playToggle") as HTMLButtonElement;
      playToggleBtn.value = "pause";
      playToggleBtn.querySelector("span")!.textContent = "Pause";
    }
  });

  // Handle section playback
  state.addListener("currentSection", (section: Section | null) => {
    // Remove previous section end time handler if exists
    if (sectionEndTimeHandler) {
      audio.removeEventListener('timeupdate', sectionEndTimeHandler);
      sectionEndTimeHandler = null;
    }

    if (section) {
      audio.currentTime = section.startTime;
      
      // Set up timeupdate handler to stop at endTime
      sectionEndTimeHandler = () => {
        if (audio.currentTime >= section.endTime) {
          audio.removeEventListener('timeupdate', sectionEndTimeHandler!);
          sectionEndTimeHandler = null;
          // Trigger ended event logic
          audio.dispatchEvent(new Event('ended'));
        }
      };
      audio.addEventListener('timeupdate', sectionEndTimeHandler);
    }
  });

  state.addListener("queue", (queue) => {
    (form.querySelector("#nextBtn")! as HTMLButtonElement).disabled = queue.length === 0;
  });

  return form;
}

function handleSongEnded(state: State, audio: HTMLAudioElement): void {
  const repeat = state.repeat;
  const currentTrack = state.currentTrack;
  const currentSection = state.currentSection;

  // Handle section repeat
  if (repeat === 'section' && currentSection) {
    // Replay the current section
    audio.currentTime = currentSection.startTime;
    audio.play();
    return;
  }

  // Handle song repeat
  if (repeat === 'song' && currentTrack) {
    // Replay the same song
    audio.currentTime = 0;
    audio.play();
    return;
  }

  // Try to play next item from queue
  if (state.queue.length > 0) {
    playNextFromQueue(state, audio);
    return;
  }

  // Queue is empty - check playlist
  if (state.currentPlaylistId && state.playlistSongs.length > 0) {
    const currentIndex = state.playlistSongs.findIndex(s => s.id === currentTrack?.id);
    const nextIndex = currentIndex + 1;

    if (nextIndex < state.playlistSongs.length) {
      // Play next song from playlist
      state.currentSection = null;
      state.currentTrack = state.playlistSongs[nextIndex];
      return;
    }

    // End of playlist
    if (repeat === 'playlist') {
      // Re-queue entire playlist and play first song
      enqueuePlaylist(state, state.currentPlaylist!);
      playNextFromQueue(state, audio);
      return;
    }
  }

  // No more songs - stop playback
  stopPlayback(state);
}

function playNextFromQueue(state: State, audio: HTMLAudioElement): void {
  const nextItem = dequeue(state);
  if (!nextItem) return;

  switch (nextItem.type) {
    case 'song':
      state.currentSection = null;
      state.currentTrack = nextItem.song;
      break;
    
    case 'section':
      state.currentSection = nextItem;
      state.currentTrack = nextItem.song;
      // Note: startTime will be applied via state listener
      break;
    
    case 'playlist':
      // This shouldn't happen if we expand playlists on enqueue
      // But handle it by enqueueing all songs
      if (state.playlistSongs.length > 0) {
        state.playlistSongs.forEach(song => enqueueSong(state, song));
        playNextFromQueue(state, audio);
      }
      break;
  }
}

function stopPlayback(state: State): void {
  // Reset play button to "play" state
  const audioToggleBtn = document.getElementById("playToggle") as HTMLButtonElement;
  if (audioToggleBtn) {
    audioToggleBtn.value = "play";
    const span = audioToggleBtn.querySelector("span");
    if (span) span.textContent = "Play";
  }
  state.currentTrack = null;
  state.currentSection = null;
}