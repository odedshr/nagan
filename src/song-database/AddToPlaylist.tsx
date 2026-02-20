/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { Playlist } from '../types.js';
import DropDown from '../ui-components/dropdown/dropdown.tsx';

export default (playlists: Playlist[]) =>
  DropDown({
    wrapperClass: 'add-to-playlist-dropdown',
    buttonClass: 'std-button add-to-playlist-button',
    buttonId: 'add-to-playlist-button',
    buttonDisabled: true,
    buttonAttributes: {
      'data-target': 'song',
    },
    buttonContent: 'Add to playlist',
    menuClass: 'add-to-playlist-menu',
    menuContent: [
      <li class="playlist-item" data-id="queue">
        <button class="add-to-playlist-option" data-playlist-id="queue" data-action="add-to-playlist-option">
          Queue
        </button>
      </li>,
      ...playlists.map(playlist => (
        <li class="playlist-item" data-id={playlist.id}>
          <button class="add-to-playlist-option" data-playlist-id={playlist.id} data-action="add-to-playlist-option">
            {playlist.name}
          </button>
        </li>
      )),
    ],
  }) as HTMLDivElement;
