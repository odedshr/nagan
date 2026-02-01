/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { Playlist, QueueItem, Song } from '../types.js';
import playlistSongs from './playlist-songs.js';

export default (playlist:Playlist|null,
  songs: QueueItem[],
  onSelected:(song: Song) => void,
  onReordered:(oldPosition: number, newPosition: number) => void,
  onOrderBy: (column?:string, asec?:boolean) => void) => (
    <article class="playlist-editor">
      <h2 id="playlist-name">{playlist?.name || "Coming up next ..."}</h2>
      <button id="shuffle">shuffle</button>
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
        {playlistSongs(songs, onSelected, onReordered)}
      </table>
    </article> as HTMLElement);