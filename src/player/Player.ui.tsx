/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { State } from '../types.js';
import Knob from '../ui-components/knob/knob.jsx';
import RepeatControl from '../queue/repeat-control.js';

export default (state:State) => (<form class="mini-player">
    <div class="cover-container">
        <img id="cover" class="cover" src="" alt="Cover Art"/>
    </div>
    <div class="track-info">
        <div class="text-info">
            <div id="title" class="track-title"></div>
            <div id="artist" class="track-artist"></div>
        </div>
        <input disabled id="progressBar" type="range" class="progress-bar" min="0" max="100" value="0" />
        <div class="time-controls">
            <input id="position" type="text" class="position" value="00:00"/>
            <span id="duration" class="duration">00:00</span>
        </div>
    </div>
    <nav class="player-controls">
        <button class="player-button" id="previousBtn" disabled><span>Previous</span></button>
        <button class="player-button" id="playToggle" value="play"><span></span></button>
        <button class="player-button" id="nextBtn" disabled><span>Next</span></button>
        {RepeatControl(state)}
        <button class="player-button" id="shuffleBtn"><span>Shuffle</span></button>
    </nav>
    <div class="knobs">
        {Knob("Playback Rate", state, 'playbackRate', 50, 200, 5)}
        {Knob("Volume", state, 'volume', 0, 100, 5)}
    </div>
    </form>  as HTMLFormElement);