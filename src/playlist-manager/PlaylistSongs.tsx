/// <reference path="../jsx.d.ts" />

import { prettyTime } from '../utils/formatters.js';
import jsx from '../jsx.js';
import { QueueItem, Song, SongQueueItem } from '../types.js';
import initDragAndDrop from '../utils/elm-drag-and-drop.js';

export type PlaylistSongsProps = {
  songs: QueueItem[];
  onSelected: (song: Song) => void;
  onReorder: (songs: QueueItem[]) => void;
};

export default ({ songs, onSelected, onReorder }: PlaylistSongsProps) => {
  let setDragIndex: (index?: number) => void;
  let fixX: (x?: number) => void;

  initDragAndDrop({ name: 'playlistSongs', items: songs, onReorder }).then(({ setDragIndex: s, fixX: f }) => {
    setDragIndex = s;
    fixX = f;
  });

  const onDragStart = (e: DragEvent) => {
    const target = (e.target as HTMLTableCellElement).parentElement as HTMLTableRowElement;
    setDragIndex(target.parentElement ? Array.from(target.parentElement.children).indexOf(target) : undefined);
    fixX(e.clientX);
  };

  return (
    <tbody class="playlist-songs">
      {(songs || []).map((queueItem, index) => {
        if (queueItem.type !== 'song') {
          return null; // Skip non-song items
        }
        const song = (queueItem as SongQueueItem).song;
        const selectSong = () => onSelected(song);
        return (
          <tr data-drop="playlist-song">
            <td class="drag-handle" draggable="true" ondragstart={onDragStart}>
              ⠿
            </td>
            <td onclick={selectSong}>{song.metadata.artists}</td>
            <td onclick={selectSong}>{song.metadata.title}</td>
            <td onclick={selectSong}>{song.metadata.album}</td>
            <td onclick={selectSong}>{prettyTime(song.metadata.duration)}</td>
            <td>
              <button class="remove-song-btn" data-action="remove-item" value={index}>
                [x]
              </button>
            </td>
          </tr>
        );
      })}
    </tbody>
  ) as HTMLTableSectionElement;
};
