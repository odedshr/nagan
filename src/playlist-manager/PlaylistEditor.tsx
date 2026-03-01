/// <reference path="../jsx.d.ts" />

import jsx from '../jsx.js';
import { Playlist } from '../types.js';

export type PlaylistEditorProps = {
  playlist: Playlist | null;
  playlistSongs: HTMLTableSectionElement;
  onOrderBy: (column?: string, asec?: boolean) => void;
};

export default ({ playlist, playlistSongs, onOrderBy }: PlaylistEditorProps) =>
  (
    <article class="playlist-editor">
      <h2 id="playlist-name">{playlist?.name || 'Coming up next ...'}</h2>
      <button id="shuffle">shuffle</button>
      <table id="songs-table" class="playlist-songs-table">
        <thead>
          <tr>
            <th>#</th>
            <th onclick={() => onOrderBy('artist', true)}>Artist</th>
            <th onclick={() => onOrderBy('title', true)}>Title</th>
            <th onclick={() => onOrderBy('album', true)}>Album</th>
            <th onclick={() => onOrderBy('duration', true)}>Duration</th>
            <th>Actions</th>
          </tr>
        </thead>
        {playlistSongs}
      </table>
    </article>
  ) as HTMLElement;
