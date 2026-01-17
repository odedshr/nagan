/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { Song } from '../types.js';
import SongDatabaseTableBody from './SongDatabaseTableBody.js';

export default (songs:Song[],
    onSongSelected:(song:Song)=>void,
    onAddToPlaylist:(song:Song)=>void) => (<div class="song-database-container">
    <table class="song-database-table">
        <thead>
            <tr>
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
        {SongDatabaseTableBody(songs, onSongSelected, onAddToPlaylist)}
    </table>
</div>  as HTMLDivElement);