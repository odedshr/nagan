import { parseBlob } from "music-metadata";
import miniPlayer from './MiniPlayer.js';

export default function initPlayer(container:HTMLElement) {
  const audio = new Audio();
  miniPlayer.setFileSelectedHandler(async (file: File) => {
    const metadata = await parseBlob(file);
    
    miniPlayer.setMetadata({
      title: metadata.common.title || "Unknown Title",
      artist: metadata.common.artist || "Unknown Artist",
      picture: metadata.common.picture || [],
      duration: metadata.format.duration || 0,
    });

    // load file to audio element or player here
    audio.src = URL.createObjectURL(file);
    // when the audio is playing, log the current time every second
    audio.addEventListener("timeupdate", () => miniPlayer.setCurrentTime(audio.currentTime));
  });

  miniPlayer.setAudioToggleHandler((isPlaying: boolean) => {
    if (isPlaying) {
      audio.play();
    } else {
      audio.pause();
    }
  });

  miniPlayer.setPositionUpdateHandler((time: number) => {
    audio.currentTime = time;
    miniPlayer.setCurrentTime(time);
  });

  container.appendChild(miniPlayer.getDivElement());
};