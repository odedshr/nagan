/// <reference path="../jsx.d.ts" />

import jsx from '../jsx.js';

export default (columns: string[], selectAll: (e: Event) => void) =>
  (
    <thead>
      <tr>
        {columns.map(column => {
          switch (column) {
            case 'select':
              return (
                <th class="select-song-col">
                  <input
                    type="checkbox"
                    id="select-all"
                    onchange={(e: Event) => selectAll(e)}
                    placeholder="Select All"
                  />
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
  ) as HTMLTableSectionElement;
