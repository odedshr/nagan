/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { State, RepeatMode } from '../types.js';
import { cycleRepeatMode } from './queue-manager.js';

function getRepeatIcon(mode: RepeatMode): string {
    switch (mode) {
        case 'none': return '🔁'; // grayed out
        case 'song': return '🔂'; // repeat one
        case 'playlist': return '🔁'; // repeat all
        case 'section': return '🔃'; // repeat section
    }
}

function getRepeatTitle(mode: RepeatMode): string {
    switch (mode) {
        case 'none': return 'Repeat: Off';
        case 'song': return 'Repeat: Song';
        case 'playlist': return 'Repeat: Playlist';
        case 'section': return 'Repeat: Section';
    }
}

export default function RepeatControl(state: State): HTMLButtonElement {
    const button = (
        <button 
            id="repeatBtn" 
            class={`player-button repeat-btn repeat-${state.repeat}`}
            title={getRepeatTitle(state.repeat)}
        >
            <span>{getRepeatIcon(state.repeat)}</span>
        </button>
    ) as HTMLButtonElement;

    button.addEventListener('click', () => {
        cycleRepeatMode(state);
    });

    state.addListener('repeat', (mode: RepeatMode) => {
        button.className = `player-button repeat-btn repeat-${mode}`;
        button.title = getRepeatTitle(mode);
        const span = button.querySelector('span');
        if (span) {
            span.textContent = getRepeatIcon(mode);
        }
    });

    return button;
}
