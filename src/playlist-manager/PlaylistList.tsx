/// <reference path="../jsx.d.ts" />

import jsx from '../jsx.js';
import { Playlist } from '../types.js';

export default (playlists: Playlist[], onPlaylistSelected: (playlist: Playlist | null) => void) =>
  (
    <ul class="playlists">
      <li class="playlist-item" data-id="queue">
        <a href="#" onclick={() => onPlaylistSelected(null)}>
          Queue
        </a>
      </li>
      {playlists.map(playlist => (
        <li class="playlist-item" data-id={playlist.id}>
          <a href="#" onclick={() => onPlaylistSelected(playlist)}>
            {playlist.name}
          </a>
          <button class="delete-playlist" data-action="delete-playlist" value={playlist.id}>
            [D]
          </button>
        </li>
      ))}
    </ul>
  ) as HTMLUListElement;
