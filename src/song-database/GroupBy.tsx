/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { SongMetadataAttribute } from '../backend/backend.ts';

const GROUP_BY_OPTIONS: SongMetadataAttribute[] = ['album', 'artists', 'genre', 'year', 'bpm'];

const LABELS: Record<SongMetadataAttribute, string> = {
  album: 'Album',
  artists: 'Artist',
  genre: 'Genre',
  year: 'Year',
  bpm: 'BPM',
};

export default (current?: SongMetadataAttribute) =>
  (
    <div class="group-by-dropdown">
      <button class="std-button group-by-button" id="group-by-button" data-action="group-by">
        Group by: {current ? LABELS[current] : 'None'}
      </button>
      <ul class="group-by-menu">
        <li class="group-by-item" data-id="none">
          <button class="group-by-option" data-action="group-by-option" disabled={current === undefined}>
            None
          </button>
        </li>
        {GROUP_BY_OPTIONS.map(option => (
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
        ))}
      </ul>
    </div>
  ) as HTMLDivElement;
