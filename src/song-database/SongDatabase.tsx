/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';

export default (
  AddToPlaylist: HTMLDivElement,
  songDatabaseTableBody: HTMLTableSectionElement,
  selectAll: (e: Event) => void
) => {
  return (
    <form id="song-database" class="song-database-container">
      <table class="song-database-table" cellpadding="0" cellspacing="0">
        <colgroup>
          <col class="select-song-col" />
          <col class="artwork-col" />
          <col class="title-col" />
          <col class="artists-col" />
          <col class="album-col" />
          <col class="genre-col" />
          <col class="year-col" />
          <col class="bpm-col" />
          <col class="duration-col" />
          <col class="tracks-col" />
          <col class="tracks-total-col" />
          <col class="comment-col" />
          <col class="file-name-col" />
        </colgroup>
        <thead>
          <tr>
            <th colspan="13" class="buttons-row">
              <div class="song-data-buttons">
                <button class="std-button" id="add-songs-button" data-action="add-songs">
                  Add Songs
                </button>
                <button
                  class="std-button"
                  disabled="true"
                  data-target="song"
                  id="edit-tags-button"
                  data-action="edit-tags"
                >
                  Edit tags
                </button>
                {AddToPlaylist}
                <button
                  class="std-button"
                  disabled="true"
                  data-target="song"
                  id="play-now-button"
                  data-action="play-now"
                >
                  Play now
                </button>
                <button class="std-button" disabled="true" data-target="song" id="delete-button" data-action="delete">
                  Delete
                </button>
              </div>
            </th>
          </tr>
          <tr>
            <th class="select-song-col">
              <input type="checkbox" id="select-all" onchange={(e: Event) => selectAll(e)} />
            </th>
            <th class="artwork-col">Art</th>
            <th class="title-col">Title</th>
            <th class="artists-col filter">
              <details>
                <summary class="filter-label">Artist(s)</summary>
                <div class="filter-options">
                  <input type="text" name="artist-filter" placeholder="Filter by artist" />
                </div>
              </details>
            </th>
            <th class="album-col">Album</th>
            <th class="genre-col">Genre</th>
            <th class="year-col">Year</th>
            <th class="bpm-col">BPM</th>
            <th class="duration-col">Duration</th>
            <th class="tracks-col">Tracks</th>
            <th class="tracks-total-col">Tracks Total</th>
            <th class="comment-col">Comment</th>
            <th class="file-name-col">File Name</th>
          </tr>
        </thead>
        {songDatabaseTableBody}
      </table>
    </form>
  ) as HTMLFormElement;
};
