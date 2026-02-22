/// <reference path="../../jsx.d.ts" />

import jsx from '../../jsx.js';
import { SongMetadataAttribute } from '../../backend/backend.ts';
import DropDown from '../../ui-components/dropdown/Dropdown.tsx';

const GROUP_BY_OPTIONS: SongMetadataAttribute[] = ['album', 'artists', 'genre', 'year', 'bpm'];

const LABELS: Record<SongMetadataAttribute, string> = {
  album: 'Album',
  artists: 'Artist',
  genre: 'Genre',
  year: 'Year',
  bpm: 'BPM',
};

export default (current?: SongMetadataAttribute[]) => {
  const selected = current ?? [];
  const label =
    selected.length === 0
      ? 'None'
      : selected.length === 1
        ? LABELS[selected[0]]
        : `${LABELS[selected[0]]} + ${LABELS[selected[1]]}`;

  const onOptionClick = (e: MouseEvent) => {
    const btn = e.currentTarget as HTMLButtonElement;
    btn.dataset.multi = e.ctrlKey || e.metaKey ? '1' : '0';
  };

  return DropDown({
    wrapperClass: 'group-by-dropdown',
    buttonClass: 'std-button group-by-button',
    buttonId: 'group-by-button',
    buttonContent: ['Group by: ', label],
    menuClass: 'group-by-menu',
    menuContent: [
      <li class="group-by-item" data-id="none">
        <button
          class="group-by-option"
          data-action="group-by-option"
          disabled={selected.length === 0}
          onclick={onOptionClick}
        >
          None
        </button>
      </li>,
      ...GROUP_BY_OPTIONS.map(option => (
        <li class="group-by-item" data-id={option}>
          <button
            class="group-by-option"
            data-group-by={option}
            data-action="group-by-option"
            disabled={selected.includes(option)}
            onclick={onOptionClick}
          >
            {LABELS[option] ?? option}
          </button>
        </li>
      )),
    ],
  });
};
