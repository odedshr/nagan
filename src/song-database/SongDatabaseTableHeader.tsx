/// <reference path="../jsx.d.ts" />

import jsx from '../jsx.js';
import initDragAndDrop from '../utils/elm-drag-and-drop.js';
import { DbSortItem } from '../types.js';

function arrow(direction: 'asc' | 'desc'): string {
  return direction === 'desc' ? '↓' : '↑';
}

export type SongDatabaseTableHeaderProps = {
  columns: string[];
  sortBy: DbSortItem[];
  selectAll: (e: Event) => void;
  onColumnOrderChanged: (columns: string[]) => void;
  onChangeSort: (key: DbSortItem['key']) => void;
};

export default ({ columns, sortBy, selectAll, onColumnOrderChanged, onChangeSort }: SongDatabaseTableHeaderProps) => {
  let setDragIndex: (index?: number) => void;
  let fixY: (y?: number) => void;

  initDragAndDrop(columns, onColumnOrderChanged).then(({ setDragIndex: s, fixY: f }) => {
    setDragIndex = s;
    fixY = f;
  });

  const onDragStart = (e: DragEvent) => {
    const target = e.target as HTMLElement;
    setDragIndex(target.parentElement ? Array.from(target.parentElement.children).indexOf(target) : undefined);
    fixY(e.clientY);
  };

  const sortIndicator = (key: DbSortItem['key'] | undefined): string => {
    if (!key) return '';
    const idx = sortBy.findIndex(s => s.key === key);
    if (idx < 0) return '';
    const item = sortBy[idx];
    const suffix = idx > 0 ? ` (${idx + 1})` : '';
    return ` ${arrow(item.direction)}${suffix}`;
  };

  return (
    <thead>
      <tr>
        {columns.map(column => {
          switch (column) {
            case 'select':
              return (
                <th class="select-song-col">
                  <input
                    type="checkbox"
                    id="select-all"
                    onchange={(e: Event) => selectAll(e)}
                    placeholder="Select All"
                  />
                </th>
              );
            case 'artwork':
              return (
                <th class="artwork-col" draggable="true" data-drop="column" ondragstart={onDragStart}>
                  Art
                </th>
              );
            case 'title':
              return (
                <th
                  class="title-col"
                  draggable="true"
                  data-drop="column"
                  ondragstart={onDragStart}
                  onclick={() => onChangeSort('title')}
                >
                  Title{sortIndicator('title')}
                </th>
              );
            case 'artists':
              return (
                <th
                  class="artists-col filter"
                  draggable="true"
                  data-drop="column"
                  ondragstart={onDragStart}
                  onclick={() => onChangeSort('artists')}
                >
                  Artist(s){sortIndicator('artists')}
                </th>
              );
            case 'album':
              return (
                <th
                  class="album-col"
                  draggable="true"
                  data-drop="column"
                  ondragstart={onDragStart}
                  onclick={() => onChangeSort('album')}
                >
                  Album{sortIndicator('album')}
                </th>
              );
            case 'genre':
              return (
                <th
                  class="genre-col"
                  draggable="true"
                  data-drop="column"
                  ondragstart={onDragStart}
                  onclick={() => onChangeSort('genre')}
                >
                  Genre{sortIndicator('genre')}
                </th>
              );
            case 'year':
              return (
                <th
                  class="year-col"
                  draggable="true"
                  data-drop="column"
                  ondragstart={onDragStart}
                  onclick={() => onChangeSort('year')}
                >
                  Year{sortIndicator('year')}
                </th>
              );
            case 'bpm':
              return (
                <th
                  class="bpm-col"
                  draggable="true"
                  data-drop="column"
                  ondragstart={onDragStart}
                  onclick={() => onChangeSort('bpm')}
                >
                  BPM{sortIndicator('bpm')}
                </th>
              );
            case 'duration':
              return (
                <th
                  class="duration-col"
                  draggable="true"
                  data-drop="column"
                  ondragstart={onDragStart}
                  onclick={() => onChangeSort('duration')}
                >
                  Duration{sortIndicator('duration')}
                </th>
              );
            case 'track':
              return (
                <th
                  class="track-col"
                  draggable="true"
                  data-drop="column"
                  ondragstart={onDragStart}
                  onclick={() => onChangeSort('track')}
                >
                  Track{sortIndicator('track')}
                </th>
              );
            // case 'tracks-total':
            //   return (
            //     <th class="tracks-total-col" draggable="true" data-drop="column" ondragstart={onDragStart} onclick={() => onChangeSort('tracks-total')}>
            //       Tracks Total{sortIndicator('tracks-total')}
            //     </th>
            //   );
            case 'comment':
              return (
                <th
                  class="comment-col"
                  draggable="true"
                  data-drop="column"
                  ondragstart={onDragStart}
                  onclick={() => onChangeSort('comment')}
                >
                  Comment{sortIndicator('comment')}
                </th>
              );
            case 'file-name':
              return (
                <th
                  class="file-name-col"
                  draggable="true"
                  data-drop="column"
                  ondragstart={onDragStart}
                  onclick={() => onChangeSort('filename')}
                >
                  File Name{sortIndicator('filename')}
                </th>
              );
            default:
              console.error(`Unknown column: ${column}`);
              return (
                <th class="unknown-col" draggable="true" data-drop="column" ondragstart={onDragStart}>
                  {column}
                </th>
              );
          }
        })}
      </tr>
    </thead>
  ) as HTMLTableSectionElement;
};
