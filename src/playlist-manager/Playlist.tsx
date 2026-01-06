/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';

export default () => (<div class="playlist-manager">
    <aside class="playlist-list">
      <input id="search" type="text" placeholder="Search playlists" />
      <button id="add-playlist">+</button>
      <ul id="playlist-list"></ul>
    </aside>
    <article class="playlist-editor">
      <h2 id="playlist-name">Select a playlist</h2>
      <table id="songs-table">
        <thead>
          <tr>
            <th>Artist</th>
            <th>Title</th>
            <th>Album</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </article>
  </div> as HTMLDivElement);