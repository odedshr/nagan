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
  const dbQuery = state.dbQuery;

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

  dbState.addListener('groups', () => {
    onGroupsChanged(dbState.groups);
  });

  dbQuery.addListener('sort', () => {
    console.log('Sort changed:', dbQuery.sort);
    onSortByDropdownChange(dbQuery.sort);
    refreshDb();
  });

  dbQuery.addListener('groupBy', async () => {
    onGroupByDropdownChange(getCurrentGroupBy());

    const groups = dbQuery.groupBy;
    const response = groups.length > 0 ? await backendService.getSongsGroups({ groups }) : { groups: [] };
    dbState.groups = response.groups;
  });

  state.addListener('playlists', (playlists: Playlist[]) => onPlaylistsChanged(playlists));

  state.dbQuery.addListener('pageSize', () => {
    state.dbQuery.pageNumber = 0; // reset to first page when page size changes
  });

  state.dbQuery.addListener('filters', () => {
    state.dbQuery.pageNumber = 0; // reset to first page when filters change
  });

  // Any dbQuery update should refresh the view.
  state.addListener('dbQuery', refreshDb);

  // When db changes, refresh the table to reflect any changes in groups, playlists, etc.
  dbState.addListener('db', refreshTable);
}
