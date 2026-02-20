/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { SongMetadataAttribute } from '../backend/backend.ts';
import DropDown from '../ui-components/dropdown/dropdown.tsx';

const GROUP_BY_OPTIONS: SongMetadataAttribute[] = ['album', 'artists', 'genre', 'year', 'bpm'];

const LABELS: Record<SongMetadataAttribute, string> = {
  album: 'Album',
  artists: 'Artist',
  genre: 'Genre',
  year: 'Year',
  bpm: 'BPM',
};

export default (current?: SongMetadataAttribute) =>
  DropDown({
    wrapperClass: 'group-by-dropdown',
    buttonClass: 'std-button group-by-button',
    buttonId: 'group-by-button',
    buttonContent: ['Group by: ', current ? LABELS[current] : 'None'],
    menuClass: 'group-by-menu',
    menuContent: [
      <li class="group-by-item" data-id="none">
        <button class="group-by-option" data-action="group-by-option" disabled={current === undefined}>
          None
        </button>
      </li>,
      ...GROUP_BY_OPTIONS.map(option => (
        <li class="group-by-item" data-id={option}>
          <button
            class="group-by-option"
            data-group-by={option}
            data-action="group-by-option"
            disabled={option === current}
          >
            {LABELS[option] ?? option}
          </button>
        </li>
      )),
    ],
  });
