/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { Playlist } from '../types.js';

export default (playlists:Playlist[],
onPlaylistSelected:(playlist: Playlist) => void,
onPlaylistDeleted:(playlist: Playlist) => void) => (<ul class="playlists">
    {playlists.map(playlist => (
      <li class="playlist-item" data-id={playlist.id}>
        <a href="#" onclick={() => {onPlaylistSelected(playlist);}}>{playlist.name}</a>
        <button class="delete-playlist" onclick={()=>onPlaylistDeleted(playlist)}>[D]</button>
      </li>))}
</ul> as HTMLUListElement);