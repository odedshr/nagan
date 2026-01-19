/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { Playlist, Song } from '../types.js';
import playlistSongs from './playlist-songs.js';

export default (playlist:Playlist|null,
  songs: Song[],
  onSelected:(song: Song) => void,
  onRemoved:(song: Song) => void,
  onReordered:(oldPosition: number, newPosition: number) => void,
  onOrderBy: (column?:string, asec?:boolean) => void) => (
    <article class="playlist-editor">
      <h2 id="playlist-name">{playlist?.name || "Select a playlist"}</h2>
      <button onclick={() => onOrderBy()}>shuffle</button>
      <table id="songs-table">
        <thead>
          <tr>
            <th>#</th>
            <th onclick={() => onOrderBy("artist", true)}>Artist</th>
            <th onclick={() => onOrderBy("title", true)}>Title</th>
            <th>Album</th>
            <th>Duration</th>
            <th>Actions</th>
          </tr>
        </thead>
        {playlistSongs(songs, onSelected, onRemoved, onReordered)}
      </table>
    </article> as HTMLElement);