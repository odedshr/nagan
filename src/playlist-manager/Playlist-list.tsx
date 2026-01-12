/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { State } from '../types.js';

export default (state:State) => (<ul class="playlists">
    {state.playlists.map(playlist => (
      <li class="playlist-item" data-id={playlist.id} onclick={() => {state.currentPlaylistId = playlist.id;}}>
        {playlist.name}
      </li>))}
</ul> as HTMLUListElement);