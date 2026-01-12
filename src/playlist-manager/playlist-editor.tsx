/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { State } from '../types.js';

export default (state:State) => (<article class="playlist-editor">
      <h2 id="playlist-name">{state.playlists.find(p => p.id === state.currentPlaylistId)?.name || "Select a playlist"}</h2>
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
    </article> as HTMLElement);