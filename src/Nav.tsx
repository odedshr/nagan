import btnDb from './assets/BtnDb';
import btnNotes from './assets/BtnNotes.js';
import btnPlaylist from './assets/BtnPlaylist.js';
import jsx from './jsx.js';

export default () =>
  (
    <nav class="nav-buttons">
      <button value="database" type="button" class="nav-button">
        {btnDb()}
        <span>Database</span>
      </button>
      <button value="playlist" type="button" class="nav-button">
        {btnPlaylist()}
        <span>Playlist</span>
      </button>
      <button value="notes" type="button" class="nav-button" disabled>
        {btnNotes()}
        <span>Notes</span>
      </button>
    </nav>
  ) as HTMLElement;
