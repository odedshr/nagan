/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { Song } from '../types.js';

export default (songs:Song[], 
    onSongSelected:(song:Song)=>void,
    onAddToPlaylist:(song:Song)=>void) => (<tbody>
        {songs.map(song => {
            const select = ()=>onSongSelected(song);
            return (<tr>
            <td onClick={select}>{song.metadata.picture && song.metadata.picture.length > 0 ? <img src={`data:${song.metadata.picture[0].format};base64,${btoa(String.fromCharCode(...new Uint8Array(song.metadata.picture[0].data)))}`} alt="Artwork" class="artwork-thumbnail"/> : 'N/A'}</td>
            <td onClick={select}>{song.metadata.title}</td>
            <td onClick={select}>{song.metadata.artists}</td>
            <td onClick={select}>{song.metadata.album}</td>
            <td onClick={select}>{song.metadata.genres.join(', ')}</td>
            <td onClick={select}>{song.metadata.year || 'N/A'}</td>
            <td onClick={select}></td>
            <td onClick={select}>{Math.floor(song.metadata.duration / 60)}:{('0' + Math.floor(song.metadata.duration % 60)).slice(-2)}</td>
            <td onClick={select}></td>
            <td onClick={select}></td>
            <td onClick={select}>{song.metadata.comment ? song.metadata.comment : 'N/A'}</td>
            <td onClick={select}></td>
            <td>
                <a href="#" onclick={(e:Event) => onAddToPlaylist(song)}>[+]</a></td>  
        </tr>);
        })}
    </tbody> as HTMLTableSectionElement);