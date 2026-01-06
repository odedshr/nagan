import Playlist from './Playlist.tsx';

export default function initSongPlaylist(container: HTMLElement) {
    container.appendChild(Playlist());
}