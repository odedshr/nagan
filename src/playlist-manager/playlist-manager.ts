import { showPrompt } from '../ui-components/prompt/prompt.ts';
import { showConfirm } from '../ui-components/confirm/confirm.ts';
import { BackendService, State, Playlist } from '../types.ts';
import PlaylistList from './Playlist-list.tsx';
import PlaylistUi from './PlaylistManager.tsx';
import PlaylistEditor from './playlist-editor.tsx';
import PlaylistSongs from './playlist-songs.tsx';

async function refreshPlaylists(state:State, backendService:BackendService) {
    try {
        const playlists = await backendService.getPlaylists({});
        state.playlists = playlists;
        if (playlists.length > 0 && (!state.currentPlaylistId || !playlists.find(p => p.id === state.currentPlaylistId))) {
            state.currentPlaylistId = playlists[0].id;
        }
    } catch (error) {
        console.error("Error fetching playlists:", error);
    }
}

export default function PlaylistManager(state:State, backendService: BackendService) {
    const onPlaylistAdded = async () => {
        console.log("Add playlist");
        const playlistName = await showPrompt("Enter playlist name:");
        if (playlistName) {
            try {
                await backendService.createPlaylist(playlistName);
                refreshPlaylists(state, backendService);
            } catch (error) {
                console.error("Error creating playlist:", error);
            }
        }
    };

    const onPlaylistSelected = (playlist: Playlist) => {
        state.currentPlaylistId = playlist.id;
    }

    const onPlaylistDeleted = async (playlist: Playlist) => {
        if (await showConfirm(`Are you sure you want to delete the playlist "${playlist.name}"?`, "Delete", "Cancel")) {
            try {
                await backendService.deletePlaylist(playlist.id);
                refreshPlaylists(state, backendService);
            } catch (error) {
                console.error("Error deleting playlist:", error);
            }
        }
    };

    const onSongSelected = (song: any) => { state.currentTrack = song; };

    const onSongRemoved = async (song: any) => {
        const position = state.playlistSongs.indexOf(song) + 1; //position starts from 1
        await backendService.removeSongFromPlaylist({ playlistId: state.currentPlaylistId!,position })
        state.playlistSongs = await backendService.getPlaylistSongs({ playlistId: state.currentPlaylistId! });
    };

    const onReorder = async (oldPosition: number, newPosition: number) => {
        const songIds = state.playlistSongs.map(s => s.id);
        const [movedSongId] = songIds.splice(oldPosition, 1);
        songIds.splice(newPosition, 0, movedSongId);
        await backendService.reorderPlaylistSongs({ playlistId: state.currentPlaylistId!, songIds: songIds })
        state.playlistSongs = await backendService.getPlaylistSongs({ playlistId: state.currentPlaylistId! });
    }

    const onOrderBy = async (column?:string, asec?:boolean) => {
        if (!column) {
            await backendService.shufflePlaylist(state.currentPlaylistId!);
        }
        state.playlistSongs = await backendService.getPlaylistSongs({ playlistId: state.currentPlaylistId! });
    };

    const elm = PlaylistUi(state.playlists, state.currentPlaylist, state.playlistSongs,
        onPlaylistAdded,
        onPlaylistSelected,
        onPlaylistDeleted,
        onSongSelected,
        onSongRemoved,
        onReorder);

    state.addListener('playlists',
        () => elm.querySelector('.playlists')!.replaceWith(
            PlaylistList(state.playlists, onPlaylistSelected, onPlaylistDeleted)
        )
    );

    state.addListener('currentPlaylistId', 
        async () => {
            elm.querySelector('.playlist-editor')!.replaceWith(
                PlaylistEditor(state.currentPlaylist, [], onSongSelected , onSongRemoved, onReorder, onOrderBy)
            )
            state.playlistSongs = await backendService.getPlaylistSongs({ playlistId: state.currentPlaylistId! });
        });

    state.addListener('playlistSongs',
        () => {
            elm.querySelector('.playlist-songs')!.replaceWith(
                PlaylistSongs(state.playlistSongs, onSongSelected , onSongRemoved, onReorder)
            )
            // if no current song, set to first song in playlist
            if (!state.currentTrack) {
                state.currentTrack = state.playlistSongs[0] || null;
            }
        }
    );

    refreshPlaylists(state, backendService);
    return elm;
}