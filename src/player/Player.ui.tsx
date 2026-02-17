/// <reference path="../JSX.d.ts" />

import btnNext from '../assets/btn-next.js';
import btnPause from '../assets/btn-pause.js';
import btnPlay from '../assets/btn-play.js';
import btnPrevious from '../assets/btn-previous.js';
import btnShuffle from '../assets/btn-shuffle.js';
import jsx from '../jsx.js';

export default (repeatControl: HTMLButtonElement, playbackRateControl: HTMLDivElement, volumeControl: HTMLDivElement) =>
  (
    <form class="mini-player">
      <div class="cover-container">
        <img id="cover" class="cover" src="" alt="Cover Art" />
      </div>
      <div class="track-info">
        <div class="text-info">
          <div id="title" class="track-title"></div>
          <div id="artist" class="track-artist"></div>
        </div>
        <input disabled id="progressBar" type="range" class="progress-bar" min="0" max="100" value="0" />
        <div class="time-controls">
          <input id="position" type="text" class="position" value="00:00" />
          <span id="duration" class="duration">
            00:00
          </span>
        </div>
      </div>
      <nav class="player-controls">
        <button class="player-button" id="previousBtn" disabled>
          {btnPrevious()}
        </button>
        <button class="player-button" id="playToggle" value="play">
          {btnPlay()}
          {btnPause()}
        </button>
        <button class="player-button" id="nextBtn" disabled>
          {btnNext()}
        </button>
        {repeatControl}
        <button class="player-button" id="shuffleBtn">
          {btnShuffle()}
        </button>
      </nav>
      <div class="knobs">
        {playbackRateControl}
        {volumeControl}
      </div>
    </form>
  ) as HTMLFormElement;
