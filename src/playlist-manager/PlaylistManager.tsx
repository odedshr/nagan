/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { Playlist, Song } from '../types.js';
import PlaylistList from './Playlist-list.js';
import PlaylistEditor from './playlist-editor.js';

export default (playlists: Playlist[],
  currentPlaylist: Playlist | null,
  songs: Song[],
  onPlaylistAdded: () => void,
  onPlaylistSelected: (playlist: Playlist) => void,
  onPlaylistDeleted: (playlist: Playlist) => void) => (
    <div class="playlist-manager">
      <aside class="playlist-list">
        <input id="search" type="text" placeholder="Search playlists" />
        <button id="add-playlist" onClick={onPlaylistAdded}>+</button>
          {PlaylistList(playlists, onPlaylistSelected, onPlaylistDeleted)}
      </aside>
      {PlaylistEditor(currentPlaylist, songs)}
    </div> as HTMLDivElement);