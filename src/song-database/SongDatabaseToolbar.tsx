/// <reference path="../jsx.d.ts" />

import BtnAddSong from '../assets/BtnAddSong.js';
import BtnEditTag from '../assets/BtnEditTag.js';
import jsx from '../jsx.js';

export type SongDatabaseProps = {
  addToPlaylist: HTMLDivElement;
  sortByDropdown: HTMLDivElement;
  groupByDropdown: HTMLDivElement;
};

export default ({ addToPlaylist, sortByDropdown, groupByDropdown }: SongDatabaseProps) => {
  const toolbar = (
    <div class="toolbar">
      <button class="std-button icon-button" data-action="add-songs">
        {BtnAddSong()}
      </button>
      <button
        class="std-button icon-button"
        disabled="true"
        data-target="song"
        id="edit-tags-button"
        data-action="edit-tags"
      >
        {BtnEditTag()}
      </button>
      {addToPlaylist}
      <button class="std-button" disabled="true" data-target="song" id="play-now-button" data-action="play-now">
        Play now
      </button>
      <button class="std-button" disabled="true" data-target="song" id="delete-button" data-action="delete">
        Delete
      </button>
      <div class="db-dropdowns">
        {sortByDropdown}
        {groupByDropdown}
      </div>
    </div>
  ) as HTMLDivElement;

  toolbar.addEventListener('toggle-song-actions', e => {
    const { enabled } = (e as CustomEvent).detail;
    toolbar
      .querySelectorAll('button[data-target="song"]')
      .forEach(btn => ((btn as HTMLButtonElement).disabled = !enabled));
  });

  return toolbar;
};
