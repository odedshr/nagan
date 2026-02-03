/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { Playlist } from '../types.js';

export default (playlists:Playlist[]) => (
  <div class="add-to-playlist-dropdown">
      <button class="std-button add-to-playlist-button" disabled="true"
        id="add-to-playlist-button"
        data-target="song"
        data-action="add-to-playlist">Add to playlist</button>
      <ul class="add-to-playlist-menu">
      {playlists.map(playlist => (
          <li class="playlist-item" data-id={playlist.id}>
            <button class="add-to-playlist-option" data-playlist-id={playlist.id} data-action="add-to-playlist-option">{playlist.name}</button>
          </li>))}
    </ul>
  </div> as HTMLDivElement);