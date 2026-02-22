/// <reference path="../../jsx.d.ts" />

import jsx from '../../jsx.js';
import DropDown from '../../ui-components/dropdown/Dropdown.tsx';
import type { DbSortItem, DbSortKey } from '../../types.ts';

const SORT_OPTIONS: DbSortKey[] = [
  'title',
  'artists',
  'album',
  'genre',
  'year',
  'bpm',
  'duration',
  'track',
  'comment',
  'filename',
  'timesPlayed',
];

const LABELS: Record<DbSortKey, string> = {
  title: 'Title',
  artists: 'Artist',
  album: 'Album',
  genre: 'Genre',
  year: 'Year',
  bpm: 'BPM',
  duration: 'Duration',
  track: 'Track',
  comment: 'Comment',
  filename: 'File Name',
  timesPlayed: 'Times Played',
};

function arrow(direction: 'asc' | 'desc'): string {
  return direction === 'desc' ? '↓' : '↑';
}

export default (current: DbSortItem[] | undefined) => {
  const primary = current?.[0];
  const label = primary ? `${LABELS[primary.key]} ${arrow(primary.direction)}` : 'None';
  const extra = current && current.length > 1 ? ` +${current.length - 1}` : '';

  const onOptionClick = (e: MouseEvent) => {
    const btn = e.currentTarget as HTMLButtonElement;
    btn.dataset.multi = e.ctrlKey || e.metaKey ? '1' : '0';
  };

  return DropDown({
    wrapperClass: 'sort-by-dropdown',
    buttonClass: 'std-button sort-by-button',
    buttonId: 'sort-by-button',
    buttonContent: ['Sort by: ', label, extra],
    menuClass: 'sort-by-menu',
    menuContent: [
      <li class="sort-by-item" data-id="none">
        <button class="sort-by-option" data-action="sort-by-option" onclick={onOptionClick}>
          None
        </button>
      </li>,
      ...SORT_OPTIONS.map(option => {
        const idx = current?.findIndex(s => s.key === option) ?? -1;
        const existing = idx >= 0 ? current?.[idx] : undefined;
        const suffix = existing ? ` ${arrow(existing.direction)}${idx > 0 ? ` (${idx + 1})` : ''}` : '';

        return (
          <li class="sort-by-item" data-id={option}>
            <button class="sort-by-option" data-action="sort-by-option" data-sort-by={option} onclick={onOptionClick}>
              {(LABELS[option] ?? option) + suffix}
            </button>
          </li>
        );
      }),
    ],
  });
};
