/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { State } from '../types.js';
import Knob from './knob.js';

export default (state:State) => (<div class="mini-player">
    <img id="cover" class="cover" src="" alt="Cover Art"/>
    <div class="track-info">
        <div class="text-info">
            <span id="title" class="title">Title</span>
            <span id="artist" class="artist">Artist</span>
            <input id="position" type="time" class="position" value="00:00"/>
            <span id="duration" class="duration">00:00</span>
        </div>
        <input disabled id="progressBar" type="range" class="progress-bar" min="0" max="100" value="0" />
    </div>
    <nav class="player-controls">
        <button class="player-button" id="loadBtn"><span>Load</span></button>
        <button class="player-button" id="previousBtn" disabled><span>Previous</span></button>
        <button class="player-button" id="playToggle" value="play"><span>Play</span></button>
        <button class="player-button" id="nextBtn" disabled><span>Next</span></button>
        <button class="player-button" id="shuffleBtn"><span>Shuffle</span></button>
    </nav>
    <div class="knobs">
        {Knob("Playback Rate", state, 'playbackRate', 50, 200, 5)}
        {Knob("Volume", state, 'volume', 0, 100, 5)}
    </div>
    </div>  as HTMLDivElement);