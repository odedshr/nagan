/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { Playlist, Song } from '../types.js';
import playlistSongs from './playlist-songs.js';

export default (playlist:Playlist|null,
  songs: Song[],
  onSelected:(song: Song) => void,
  onRemoved:(song: Song) => void) => (
    <article class="playlist-editor">
      <h2 id="playlist-name">{playlist?.name || "Select a playlist"}</h2>
      <table id="songs-table">
        <thead>
          <tr>
            <th>Artist</th>
            <th>Title</th>
            <th>Album</th>
            <th>Duration</th>
            <th>Actions</th>
          </tr>
        </thead>
        {playlistSongs(songs, onSelected, onRemoved)}
      </table>
    </article> as HTMLElement);