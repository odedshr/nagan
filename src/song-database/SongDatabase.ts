import { BackendService, FileDropEvent, FileLoadedEvent, Song, State, TauriFile } from '../types.ts';
import SongDatabaseUI from './SongDatabase.tsx';
import SongDatabaseTableBody from './SongDatabaseTableBody.tsx';

function refreshSongs(state:State, backendService:BackendService) {
    backendService.getSongs({}).then(response => state.db = response.songs).catch(error => {
        console.error("Error fetching songs:", error);
    });
}

export default function SongDatabase(
    state:State,
    backendService:BackendService) {
        state.addListener('lastEvent', async (event?:CustomEvent) => {
            if (event) {
                switch (event.type) {
                    case 'file-loaded':
                        const { file, metadata } = (event as FileLoadedEvent).detail;
                        const song = await backendService.addSong(file.name, metadata);
                        console.log(`✅ Added song:`, song);
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
                console.log(`Song "${song.metadata.title}" added to playlist.`);
            } else {
                console.error('No playlist selected. Cannot add song to playlist.');
            }
        };

        const elm = SongDatabaseUI(state.db, onSongSelected, onAddToPlaylist);
        
        state.addListener('db', 
            (songs:Song[]) => elm.querySelector('tbody')!.replaceWith(SongDatabaseTableBody(songs as Song[], onSongSelected, onAddToPlaylist))
        );
        refreshSongs(state, backendService);

        return elm;
}