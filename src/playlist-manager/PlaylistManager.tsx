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
  onPlaylistDeleted: (playlist: Playlist) => void,
  onSongSelected: (song: Song) => void,
  onSongRemoved: (song: Song) => void,
  onReordered: (oldPosition: number, newPosition: number) => void) => (
    <div class="playlist-manager">
      <aside class="playlist-list">
        <input id="search" type="text" placeholder="Search playlists" />
        <button id="add-playlist" onclick={onPlaylistAdded}>+</button>
          {PlaylistList(playlists, onPlaylistSelected, onPlaylistDeleted)}
      </aside>
      {PlaylistEditor(currentPlaylist, songs, onSongSelected, onSongRemoved, onReordered)}
    </div> as HTMLDivElement);