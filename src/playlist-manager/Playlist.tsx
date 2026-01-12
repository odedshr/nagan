/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { State } from '../types.js';
import PlaylistList from './Playlist-list.js';
import PlaylistEditor from './playlist-editor.js';

export default (state:State) => (<div class="playlist-manager">
    <aside class="playlist-list">
      <input id="search" type="text" placeholder="Search playlists" />
      <button id="add-playlist">+</button>
      <div class="playlists-container">
        {PlaylistList(state)}
      </div>
    </aside>
    {PlaylistEditor(state)}
  </div> as HTMLDivElement);