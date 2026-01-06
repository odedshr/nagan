import SongDatabase from './SongDatabase.tsx';

export default function initSongDatabase(container: HTMLElement) {
    container.appendChild(SongDatabase());
}