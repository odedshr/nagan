/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { Song } from '../types.js';

export default (songs:Song[], 
    onSongSelected:(song:Song)=>void,
    onAddToPlaylist:(song:Song)=>void,
    onRemoveSong:(song:Song)=>void) => (<tbody>
        {songs.map(song => {
            const select = ()=>onSongSelected(song);
            return (<tr>
            <td onclick={select}>{song.metadata.picture && song.metadata.picture.length > 0 ? <img src={`data:${song.metadata.picture[0].format};base64,${btoa(String.fromCharCode(...new Uint8Array(song.metadata.picture[0].data)))}`} alt="Artwork" class="artwork-thumbnail"/> : 'N/A'}</td>
            <td onclick={select}>{song.metadata.title}</td>
            <td onclick={select}>{song.metadata.artists}</td>
            <td onclick={select}>{song.metadata.album}</td>
            <td onclick={select}>{song.metadata.genres.join(', ')}</td>
            <td onclick={select}>{song.metadata.year || 'N/A'}</td>
            <td onclick={select}></td>
            <td onclick={select}>{Math.floor(song.metadata.duration / 60)}:{('0' + Math.floor(song.metadata.duration % 60)).slice(-2)}</td>
            <td onclick={select}></td>
            <td onclick={select}></td>
            <td onclick={select}>{song.metadata.comment ? song.metadata.comment : 'N/A'}</td>
            <td onclick={select}></td>
            <td>
                <a href="#" onclick={() => onAddToPlaylist(song)}>[+]</a>
                <a href="#" onclick={() => onRemoveSong(song)}>[D]</a>
            </td>  
        </tr>);
        })}
    </tbody> as HTMLTableSectionElement);