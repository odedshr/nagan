/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { Song } from '../types.js';

export default (songs: Song[]) => (<tbody class="playlist-songs">
    {(songs||[]).map(song => {
        return (<tr>
            <td>{song.metadata.artists}</td>
            <td>{song.metadata.title}</td>
            <td>{song.metadata.album}</td>
        </tr>);
    })} 
</tbody> as HTMLTableSectionElement);