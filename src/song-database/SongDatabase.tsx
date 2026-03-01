/// <reference path="../jsx.d.ts" />

import BtnAddSong from '../assets/BtnAddSong.js';
import BtnEditTag from '../assets/BtnEditTag.js';
import jsx from '../jsx.js';

export type SongDatabaseProps = {
  groups: HTMLDivElement;
  columns: string[];
  addToPlaylist: HTMLDivElement;
  sortByDropdown: HTMLDivElement;
  groupByDropdown: HTMLDivElement;
  header: HTMLTableSectionElement;
  body: HTMLTableSectionElement;
  footer: HTMLTableSectionElement;
};

export default ({
  groups,
  columns,
  addToPlaylist,
  sortByDropdown,
  groupByDropdown,
  header,
  body,
  footer,
}: SongDatabaseProps) => {
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
      {groups}
      <div class="db-table-scroll">
        <table class="db-table" cellpadding="0" cellspacing="0">
          <colgroup>
            {columns.map(column => (
              <col class={`${column}-col`}></col>
            ))}
          </colgroup>
          {header}
          {body}
          {footer}
        </table>
      </div>
    </form>
  ) as HTMLFormElement;
};
