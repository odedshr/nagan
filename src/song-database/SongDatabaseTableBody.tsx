/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { Song } from '../types.js';

export default (songs:Song[]) => (<tbody>
        {songs.map(song => (<tr>
            <td>{song.metadata.picture && song.metadata.picture.length > 0 ? <img src={`data:${song.metadata.picture[0].format};base64,${btoa(String.fromCharCode(...new Uint8Array(song.metadata.picture[0].data)))}`} alt="Artwork" class="artwork-thumbnail"/> : 'N/A'}</td>
            <td>{song.metadata.title}</td>
            <td>{song.metadata.artists}</td>
            <td>{song.metadata.album}</td>
            <td>{song.metadata.genres.join(', ')}</td>
            <td>{song.metadata.year || 'N/A'}</td>
            <td></td>
            <td>{Math.floor(song.metadata.duration / 60)}:{('0' + Math.floor(song.metadata.duration % 60)).slice(-2)}</td>
            <td></td>
            <td></td>
            <td>{song.metadata.comment ? song.metadata.comment : 'N/A'}</td>
            <td></td>
            <td></td>  
        </tr>))}
    </tbody> as HTMLTableSectionElement);