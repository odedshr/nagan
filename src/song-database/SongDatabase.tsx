/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { Song } from '../types.js';
import SongDatabaseTableBody from './SongDatabaseTableBody.js';

export default (songs:Song[],
    onPlaySong:(song:Song)=>void,
    onAddToPlaylist:(song:Song)=>void,
    onRemoveSong:(song:Song)=>void) => {
        const selectedSongs = new Set<Song>();

        const selectAll = (e:Event) => {
            const checked = (e.target as HTMLInputElement).checked;
            (document.querySelectorAll('.select-song-checkbox') as NodeListOf<HTMLInputElement>).forEach(checkbox => {
                checkbox.checked = checked;
                checkbox.dispatchEvent(new Event('change'));
            });
        };

        const onToggleSong = (song:Song, checked:boolean) => {
            if (checked) {
                selectedSongs.add(song);
            } else {
                selectedSongs.delete(song);
            }

            const anySongsSelected = selectedSongs.size > 0;
            document.querySelectorAll('button[data-target="song"]').forEach(btn => (btn as HTMLButtonElement).disabled = !anySongsSelected);
        }

        return (<form class="song-database-container">
            <table class="song-database-table" cellpadding="0" cellspacing="0">
                <thead>
                    <tr>
                        <th colspan="14" class="buttons-row"> 
                            <button class="std-button" id="add-songs-button">Add Songs</button>
                            <button class="std-button" disabled="true" data-target="song" id="edit-tags-button">Edit tags</button>
                            <button class="std-button" disabled="true" data-target="song" id="add-to-queue-button">Add to queue</button>
                            <button class="std-button" disabled="true" data-target="song" id="add-to-playlist-button">Add to playlist</button>
                            <button class="std-button" disabled="true" data-target="song" id="play-now-button">Play now</button>
                        </th>
                    </tr>
                    <tr>
                        <th><input type="checkbox" id="select-all" onchange={(e:Event)=>selectAll(e)}/></th>
                        <th>Artwork</th>
                        <th>Title</th>
                        <th>Artist</th>
                        <th>Album</th>
                        <th>Genre</th>
                        <th>Year</th>
                        <th>Album Artist</th>
                        <th>Duration</th>
                        <th>Tracks</th>
                        <th>Tracks Total</th>
                        <th>Comment</th>
                        <th>File Name</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                {SongDatabaseTableBody(songs, onToggleSong, onPlaySong, onAddToPlaylist, onRemoveSong)}
            </table>
        </form>  as HTMLFormElement);
};