/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { Song } from '../types.js';

export default (songs: Song[], onSongSelected:(song: Song) => void, onRemoved:(song: Song) => void) => (<tbody class="playlist-songs">
    {(songs||[]).map(song => {
        const onSelected = () => onSongSelected(song);
        return (<tr>
            <td onclick={onSelected}>{song.metadata.artists}</td>
            <td onclick={onSelected}>{song.metadata.title}</td>
            <td onclick={onSelected}>{song.metadata.album}</td>
            <td onclick={onSelected}>{song.metadata.duration}</td>
            <td>
              <button class="remove-song-btn" onclick={() => onRemoved(song)}>[x]</button>
            </td>
        </tr>);
    })} 
</tbody> as HTMLTableSectionElement);