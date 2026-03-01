import { BackendService, SongGroupsResponseItem, SongMetadataAttribute } from '../backend/backend.ts';
import { DbSortItem, FileDropEvent, Playlist, State } from '../types.ts';
import { SongDatabaseState } from './song-database-state.ts';

export type SongDatabaseListenerDeps = {
  state: State;
  dbState: SongDatabaseState;
  backendService: BackendService;
  refreshDb: () => Promise<void>;
  refreshTable: () => void;
  onSortByDropdownChange: (current: DbSortItem[]) => void;
  onGroupByDropdownChange: (current: SongMetadataAttribute[]) => void;
  onGroupsChanged: (groups: SongGroupsResponseItem[]) => void;
  onPlaylistsChanged: (playlists: Playlist[]) => void;
  onFilesDropped: (files: File[]) => void;
  getCurrentGroupBy: () => SongMetadataAttribute[];
};

export function attachSongDatabaseStateListeners({
  state,
  dbState,
  backendService,
  refreshDb,
  refreshTable,
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
        onFilesDropped(files);
        break;
      }
    }
  });

  dbState.addListener('db', refreshTable);

  state.addListener('dbFilters', refreshDb);

  state.addListener('dbSort', () => {
    console.log('Sort changed:', state.dbSort);
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
}
