/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';

export default (
  columns: string[],
  AddToPlaylist: HTMLDivElement,
  songDatabaseTableBody: HTMLTableSectionElement,
  selectAll: (e: Event) => void
) => {
  return (
    <form id="song-database" class="song-database-container">
      <table class="song-database-table" cellpadding="0" cellspacing="0">
        <colgroup>
          {columns.map(column => (
            <col class={`${column}-col`} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th colspan={columns.length} class="buttons-row">
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
            {columns.map(column => {
              switch (column) {
                case 'select':
                  return (
                    <th class="select-song-col">
                      <input type="checkbox" id="select-all" onchange={(e: Event) => selectAll(e)} />
                    </th>
                  );
                case 'artwork':
                  return <th class="artwork-col">Art</th>;
                case 'title':
                  return <th class="title-col">Title</th>;
                case 'artists':
                  return (
                    <th class="artists-col filter">
                      <details>
                        <summary class="filter-label">Artist(s)</summary>
                        <div class="filter-options">
                          <input type="text" name="artist-filter" placeholder="Filter by artist" />
                        </div>
                      </details>
                    </th>
                  );
                case 'album':
                  return <th class="album-col">Album</th>;
                case 'genre':
                  return <th class="genre-col">Genre</th>;
                case 'year':
                  return <th class="year-col">Year</th>;
                case 'bpm':
                  return <th class="bpm-col">BPM</th>;
                case 'duration':
                  return <th class="duration-col">Duration</th>;
                case 'track':
                  return <th class="track-col">Track</th>;
                case 'tracks-total':
                  return <th class="tracks-total-col">Tracks Total</th>;
                case 'comment':
                  return <th class="comment-col">Comment</th>;
                case 'file-name':
                  return <th class="file-name-col">File Name</th>;
                default:
                  console.error(`Unknown column: ${column}`);
                  return <th>{column}</th>;
              }
            })}
          </tr>
        </thead>
        {songDatabaseTableBody}
      </table>
    </form>
  ) as HTMLFormElement;
};
