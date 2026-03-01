/// <reference path="../jsx.d.ts" />

import jsx from '../jsx.js';

export type PlaylistManagerProps = {
  playlistList: HTMLElement;
  playlistEditor: HTMLElement;
};

export default ({ playlistList, playlistEditor }: PlaylistManagerProps) =>
  (
    <form id="playlist-manager" class="playlist-manager">
      <aside class="playlist-list">
        <button id="add-playlist">Add Playlist</button>
        {playlistList}
      </aside>
      {playlistEditor}
    </form>
  ) as HTMLFormElement;
