/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { Song } from '../types.js';

function getArtistsString(artists: string | string[] | undefined): string {
  if (!artists) return '';
  // if artists is array, join with commas and "&" for the last one, otherwise return as is
  if (Array.isArray(artists)) {
    if (artists.length === 1) {
      return artists[0];
    }
    const lastArtist = artists.pop();
    return artists.join(', ') + ' & ' + lastArtist;
  }
  return artists;
}

export default (
  songs: Song[],
  selectedSongs: string[],
  columns: string[],
  onToggleSong: (song: Song, checked: boolean) => void,
  onPlaySong: (song: Song) => void
) =>
  (
    <tbody>
      {songs.map(song => {
        const play = () => onPlaySong(song);
        const onChangeToggle = (e: Event) => onToggleSong(song, (e.target as HTMLInputElement).checked);
        const artists = getArtistsString(song.metadata.artists);
        const genres = song.metadata.genres ? song.metadata.genres.join(', ') : '';

        return (
          <tr>
            {columns.map(column => {
              switch (column) {
                case 'select':
                  return (
                    <td class="select-song-col">
                      <input
                        type="checkbox"
                        class="select-song-checkbox"
                        name="selected-song"
                        value={song.id}
                        checked={selectedSongs.includes(song.id)}
                        onchange={onChangeToggle}
                      />
                    </td>
                  );
                case 'artwork':
                  return (
                    <td onclick={play} class="artwork-cell">
                      {song.metadata.image ? (
                        <img src={song.metadata.image} alt="Artwork" class="artwork-thumbnail" />
                      ) : (
                        'N/A'
                      )}
                    </td>
                  );
                case 'title':
                  return (
                    <td onclick={play} class="text-cell" title={song.metadata.title}>
                      {song.metadata.title}
                    </td>
                  );
                case 'artists':
                  return (
                    <td onclick={play} class="artists-col text-cell" title={artists}>
                      {artists}
                    </td>
                  );
                case 'album':
                  return (
                    <td onclick={play} class="album-col text-cell" title={song.metadata.album}>
                      {song.metadata.album}
                    </td>
                  );
                case 'genre':
                  return (
                    <td onclick={play} class="genre-col text-cell" title={genres}>
                      {genres}
                    </td>
                  );
                case 'year':
                  return (
                    <td onclick={play} class="number-cell year-col" title={song.metadata.year || ''}>
                      {song.metadata.year || ''}
                    </td>
                  );
                case 'bpm':
                  return (
                    <td onclick={play} class="number-cell bpm-col" title={song.metadata.bpm || ''}>
                      {song.metadata.bpm || ''}
                    </td>
                  );
                case 'duration':
                  return (
                    <td onclick={play} class="number-cell">
                      {Math.floor(song.metadata.duration / 60)}:
                      {('0' + Math.floor(song.metadata.duration % 60)).slice(-2)}
                    </td>
                  );
                case 'track':
                  return (
                    <td onclick={play} class="number-cell">
                      {song.metadata.track}
                    </td>
                  );
                case 'tracks-total':
                  return <td onclick={play} class="number-cell"></td>;
                case 'comment':
                  return (
                    <td onclick={play} class="comment-col" title={song.metadata.comment ? song.metadata.comment : ''}>
                      {song.metadata.comment ? song.metadata.comment : '\u00A0'}
                    </td>
                  );
                case 'file-name':
                  return (
                    <td onclick={play} class="file-name-col" title={song.url}>
                      {song.url}
                    </td>
                  );
                default:
                  console.warn(`Unknown column: ${column}`);
              }
            })}
          </tr>
        );
      })}
    </tbody>
  ) as HTMLTableSectionElement;
