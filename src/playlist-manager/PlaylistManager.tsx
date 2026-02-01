/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { Playlist, QueueItem, Song } from '../types.js';
import PlaylistList from './Playlist-list.js';
import PlaylistEditor from './playlist-editor.js';

export default (
  playlists: Playlist[],
  currentPlaylist: Playlist | null,
  songs: QueueItem[],
  onPlaylistSelected: (playlist: Playlist|null) => void,
  onSongSelected: (song: Song) => void,
  onReordered: (oldPosition: number, newPosition: number) => void,
  onOrderBy: (column?: string, asc?: boolean) => void) => (
    <form id="playlist-manager"class="playlist-manager">
      <aside class="playlist-list">
        <button id="add-playlist">Add Playlist</button>
          {PlaylistList(playlists, onPlaylistSelected)}
      </aside>
      {PlaylistEditor(currentPlaylist, songs, onSongSelected, onReordered, onOrderBy)}
    </form> as HTMLFormElement);