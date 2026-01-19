/// <reference path="../JSX.d.ts" />

import { prettyTime } from '../formatters.js';
import jsx from '../jsx.js';
import { Song } from '../types.js';

export default (songs: Song[],
    onSongSelected:(song: Song) => void,
    onRemoved:(song: Song) => void,
    onReorder:(oldPosition: number, newPosition: number) => void) => {
    
    let draggedIndex: number | null = null;

    const handleDragStart = (e: DragEvent, index: number) => {
        draggedIndex = index;
        const row = (e.target as HTMLElement).closest('tr');
        if (row) {
            row.classList.add('dragging');
        }
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', index.toString());
        }
    };

    const handleDragEnd = (e: DragEvent) => {
        const row = (e.target as HTMLElement).closest('tr');
        if (row) {
            row.classList.remove('dragging');
        }
        draggedIndex = null;
        // Remove drag-over class from all rows
        document.querySelectorAll('.playlist-songs tr.drag-over').forEach(row => {
            row.classList.remove('drag-over');
        });
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
    };

    const handleDragEnter = (e: DragEvent) => {
        e.preventDefault();
        const target = (e.target as HTMLElement).closest('tr');
        if (target) {
            target.classList.add('drag-over');
        }
    };

    const handleDragLeave = (e: DragEvent) => {
        const target = (e.target as HTMLElement).closest('tr');
        if (target) {
            target.classList.remove('drag-over');
        }
    };

    const handleDrop = (e: DragEvent, dropIndex: number) => {
        e.preventDefault();
        const target = (e.target as HTMLElement).closest('tr');
        if (target) {
            target.classList.remove('drag-over');
        }
        
        console.log(`Dropped on index: ${dropIndex}`);
        if (draggedIndex !== null && draggedIndex !== dropIndex) {
            onReorder(draggedIndex, dropIndex);
        }
        draggedIndex = null;
    };

    return (<tbody class="playlist-songs">
        {(songs||[]).map((song, index) => {
            const onSelected = () => onSongSelected(song);
            return (<tr 
                ondragover={handleDragOver}
                ondragenter={handleDragEnter}
                ondragleave={handleDragLeave}
                ondrop={(e: DragEvent) => handleDrop(e, index)}
            >
                <td class="drag-handle"
                    draggable={true}
                    ondragstart={(e: DragEvent) => handleDragStart(e, index)}
                    ondragend={handleDragEnd}
                >⠿</td>
                <td onclick={onSelected}>{song.metadata.artists}</td>
                <td onclick={onSelected}>{song.metadata.title}</td>
                <td onclick={onSelected}>{song.metadata.album}</td>
                <td onclick={onSelected}>{prettyTime(song.metadata.duration)}</td>
                <td>
                  <button class="remove-song-btn" onclick={() => onRemoved(song)}>[x]</button>
                </td>
            </tr>);
        })} 
    </tbody> as HTMLTableSectionElement);
};