/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { Playlist, Song } from '../types.js';
import playlistSongs from './playlist-songs.js';

export default (playlist:Playlist|null, songs: Song[]) => (<article class="playlist-editor">
      <h2 id="playlist-name">{playlist?.name || "Select a playlist"}</h2>
      <table id="songs-table">
        <thead>
          <tr>
            <th>Artist</th>
            <th>Title</th>
            <th>Album</th>
          </tr>
        </thead>
        {playlistSongs(songs)}
      </table>
    </article> as HTMLElement);