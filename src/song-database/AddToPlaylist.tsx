/// <reference path="../jsx.d.ts" />

import BtnAddToPlaylist from '../assets/BtnAddToPlaylist.tsx';
import jsx from '../jsx.js';
import { Playlist } from '../types.js';
import DropDown from '../ui-components/dropdown/Dropdown.tsx';

export default (playlists: Playlist[]) =>
  DropDown({
    wrapperClass: 'add-to-playlist-dropdown',
    buttonClass: 'std-button add-to-playlist-button',
    buttonId: 'add-to-playlist-button',
    buttonDisabled: true,
    buttonAttributes: {
      'data-target': 'song',
      class: 'std-button icon-button add-to-playlist-button',
    },
    buttonContent: BtnAddToPlaylist(),
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
