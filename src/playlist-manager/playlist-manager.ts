import { showPrompt } from '../modal/modal.ts';
import { BackendService, State } from '../types.ts';
import PlaylistList from './Playlist-list.tsx';
import Playlist from './Playlist.tsx';

function refreshPlaylists(state:State, backendService:BackendService) {
    backendService.getPlaylists({}).then(playlists => state.playlists = playlists).catch(error => {
        console.error("Error fetching playlists:", error);
    });
}
export default function PlaylistManager(state:State, backendService: BackendService) {
    const elm = Playlist(state);
    state.addListener('playlists',
        () => elm.querySelector('.playlists-container')!.replaceWith(PlaylistList(state))
    );

    (elm.querySelector('#add-playlist') as HTMLButtonElement)
        .addEventListener('click', async () => {
            const playlistName = await showPrompt("Enter playlist name:");
            if (playlistName) {
                try {
                    await backendService.createPlaylist(playlistName);
                    refreshPlaylists(state, backendService);
                } catch (error) {
                    console.error("Error creating playlist:", error);
                }
            }
        });

    state.addListener('currentPlaylistId', () => {
        console.log('Current playlist changed to:', state.currentPlaylistId);
    });

    refreshPlaylists(state, backendService);
    return elm;
}