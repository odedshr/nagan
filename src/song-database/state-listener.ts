import { BackendService, SongGroupsResponseItem, SongMetadataAttribute } from '../backend/backend.ts';
import { DbSortItem, FileDropEvent, Playlist, State } from '../types.ts';
import { SongDatabaseState } from './song-database-state.ts';

export type SongDatabaseListenerDeps = {
  state: State;
  dbState: SongDatabaseState;
  backendService: BackendService;
  artistFilterInput: HTMLInputElement;
  refreshDb: () => Promise<void>;
  rerenderTableBody: () => void;
  onSortByDropdownChange: (current: DbSortItem[]) => void;
  onGroupByDropdownChange: (current: SongMetadataAttribute | undefined) => void;
  onGroupsChanged: (groups: SongGroupsResponseItem[]) => void;
  onPlaylistsChanged: (playlists: Playlist[]) => void;
  onFilesDropped?: (files: File[]) => void;
  getCurrentGroupBy: () => SongMetadataAttribute | undefined;
};

export function attachSongDatabaseStateListeners({
  state,
  dbState,
  backendService,
  artistFilterInput,
  refreshDb,
  rerenderTableBody,
  onSortByDropdownChange,
  onGroupByDropdownChange,
  onGroupsChanged,
  onPlaylistsChanged,
  onFilesDropped,
  getCurrentGroupBy,
}: SongDatabaseListenerDeps) {
  state.addListener('lastEvent', async (event?: CustomEvent) => {
    if (!event) {
      return;
    }

    switch (event.type) {
      case 'file-loaded':
        await refreshDb();
        break;
      case 'files-dropped': {
        const files = (event as FileDropEvent).detail.files as File[];
        if (onFilesDropped) {
          onFilesDropped(files);
        }
        break;
      }
    }
  });

  dbState.addListener('db', rerenderTableBody);
  dbState.addListener('artistFilter', rerenderTableBody);

  state.addListener('dbFilters', refreshDb);

  state.addListener('dbSort', () => {
    onSortByDropdownChange(state.dbSort);
    refreshDb();
  });

  state.addListener('groupBy', async () => {
    onGroupByDropdownChange(getCurrentGroupBy());

    const response =
      state.groupBy.length > 0 ? await backendService.getSongsGroups({ groups: state.groupBy }) : { groups: [] };
    dbState.groups = response.groups;
  });

  dbState.addListener('groups', () => {
    onGroupsChanged(dbState.groups);
  });

  state.addListener('playlists', (playlists: Playlist[]) => {
    onPlaylistsChanged(playlists);
  });

  dbState.bidi('artistFilter', artistFilterInput, 'value', 'input');
}
