/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';

export default () => (<div class="mini-player">
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
                    <input type="number" id="speedInput" class="speed-input" value="100" step="5" min="50" max="200"/>
                </nav>
            </div>  as HTMLDivElement);