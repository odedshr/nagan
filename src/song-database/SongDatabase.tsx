/// <reference path="../jsx.d.ts" />

import BtnAddSong from '../assets/BtnAddSong.js';
import BtnEditTag from '../assets/BtnEditTag.js';
import jsx from '../jsx.js';

export default (
  groups: HTMLDivElement,
  columns: string[],
  AddToPlaylist: HTMLDivElement,
  sortByDropdown: HTMLDivElement,
  groupByDropdown: HTMLDivElement,
  songDatabaseTableHeader: HTMLTableSectionElement,
  songDatabaseTableBody: HTMLTableSectionElement
) => {
  return (
    <form class="song-database-container">
      <div class="db-controls">
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
        {AddToPlaylist}
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
      {groups}
      <div class="db-table-scroll">
        <table class="db-table" cellpadding="0" cellspacing="0">
          <colgroup>
            {columns.map(column => (
              <col class={`${column}-col`}></col>
            ))}
          </colgroup>
          {songDatabaseTableHeader}
          {songDatabaseTableBody}
        </table>
      </div>
    </form>
  ) as HTMLFormElement;
};
