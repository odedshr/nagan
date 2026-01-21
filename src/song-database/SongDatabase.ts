import { BackendService } from '../backend/backend.ts';
import { FileDropEvent, Song, State, TauriFile } from '../types.ts';
import { showConfirm } from '../ui-components/confirm/confirm.ts';
import SongDatabaseUI from './SongDatabase.tsx';
import SongDatabaseTableBody from './SongDatabaseTableBody.tsx';

async function refreshSongs(state:State, backendService:BackendService) {
    try {
        const response = await backendService.getSongs({});
        state.db = response.songs;
    } catch (error) {
        console.error("Error fetching songs:", error);
    }
}

export default function SongDatabase(
    state:State,
    backendService:BackendService) {
        state.addListener('lastEvent', async (event?:CustomEvent) => {
            if (event) {
                switch (event.type) {
                    case 'file-loaded':
                        // const { file, metadata } = (event as FileLoadedEvent).detail;
                        // const song = await backendService.addSong(file.name, metadata);
                        refreshSongs(state, backendService);
                        break;
                    case 'files-dropped':
                        const files = (event as FileDropEvent).detail.files as File[];
                        files.forEach(async (file: File) => {
                            try {
                                console.log(`➕ Adding song from file: ${file.name}, ${(file as TauriFile).path}`);
                                // const song = await backendService.addSong(file.path);
                                // console.log(`✅ Added song: ${song.title} by ${song.artist}`);
                            } catch (error) {
                                console.error(`❌ Failed to add song from file ${file.name}:`, error);
                            }
                        });
                        break;
                }  
            }
        });

        const onSongSelected = (song:Song) => {
            state.currentTrack = song;
        };

        const onAddToPlaylist = async (song:Song) => {
            if (!!state.currentPlaylistId) {
                await backendService.addSongToPlaylist({ playlistId: state.currentPlaylistId, songId: song.id });
                state.playlistSongs = await backendService.getPlaylistSongs({ playlistId: state.currentPlaylistId });
            } else {
                console.error('No playlist selected. Cannot add song to playlist.');
            }
        };

        const onRemoveSong = async (song:Song) => {
            if (await showConfirm(`Are you sure you want to delete the song: ${song.filename}? This action cannot be undone.`)) {
                const success = await backendService.deleteSong(song.id);
                if (success) {
                    refreshSongs(state, backendService);
                } else {
                    console.error(`❌ Failed to delete song: ${song.id}`);
                }
            }
        };

        const elm = SongDatabaseUI(state.db, onSongSelected, onAddToPlaylist, onRemoveSong);
        
        state.addListener('db', 
            () => elm.replaceWith(SongDatabaseUI(state.db, onSongSelected, onAddToPlaylist, onRemoveSong))
        );
        
        refreshSongs(state, backendService);

        return elm;
}