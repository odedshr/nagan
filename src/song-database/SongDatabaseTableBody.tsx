/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { Song } from '../types.js';

export default (songs:Song[],
    onToggleSong:(song:Song, checked:boolean)=>void,
    onPlaySong:(song:Song)=>void) => (<tbody>
        {songs.map(song => {
            const play = ()=>onPlaySong(song);
            const onChangeToggle = (e:Event)=>onToggleSong(song,(e.target as HTMLInputElement).checked);
            return (<tr>
            <td><input type="checkbox" class="select-song-checkbox" name="selected-song" value={song.id} onchange={onChangeToggle}/></td>
            <td onclick={play}>{song.metadata.image ? <img src={song.metadata.image} alt="Artwork" class="artwork-thumbnail"/> : 'N/A'}</td>
            <td onclick={play}>{song.metadata.title}</td>
            <td onclick={play}>{song.metadata.artists}</td>
            <td onclick={play}>{song.metadata.album}</td>
            <td onclick={play}>{song.metadata.genres.join(', ')}</td>
            <td onclick={play}>{song.metadata.year || 'N/A'}</td>
            <td onclick={play}></td>
            <td onclick={play}>{Math.floor(song.metadata.duration / 60)}:{('0' + Math.floor(song.metadata.duration % 60)).slice(-2)}</td>
            <td onclick={play}>{song.metadata.track}</td>
            <td onclick={play}></td>
            <td onclick={play}>{song.metadata.comment ? song.metadata.comment : 'N/A'}</td>
            <td onclick={play}>{song.url}</td>
        </tr>);
        })}
    </tbody> as HTMLTableSectionElement);