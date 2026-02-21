import { BackendService, SongGroupSortBy, SongMetadataAttribute } from '../backend/backend.ts';
import { enqueueSongsNext } from '../queue/queue-manager.ts';
import { Song, SongMetadata, State } from '../types.ts';
import editId3Tags from './id3-tag-editor/Id3TagEditor.ts';
import { SongDatabaseState } from './song-database.state.ts';
import { browseFile, songsFromIds } from './addSongs.ts';
import { saveUpdatedSongs } from './updateSongs.ts';

export type GetCurrentGroupBy = () => SongMetadataAttribute | undefined;

export type SongDatabaseActionHandlerDeps = {
  state: State;
  dbState: SongDatabaseState;
  backendService: BackendService;
  getCurrentGroupBy: GetCurrentGroupBy;
  browseFileFn?: typeof browseFile;
  editId3TagsFn?: typeof editId3Tags;
  saveUpdatedSongsFn?: typeof saveUpdatedSongs;
  enqueueSongsNextFn?: typeof enqueueSongsNext;
  onRemoveSong: (song: Song) => Promise<void>;
  addSongsToPlaylist: (playlistId: string | null, songs: Song[]) => Promise<void>;
  refreshDb: () => Promise<void>;
  songsFromIdsFn?: typeof songsFromIds;
};

export function createSongDatabaseActionHandler({
  state,
  dbState,
  backendService,
  getCurrentGroupBy,
  onRemoveSong,
  addSongsToPlaylist,
  refreshDb,
  browseFileFn = browseFile,
  editId3TagsFn = editId3Tags,
  saveUpdatedSongsFn = saveUpdatedSongs,
  enqueueSongsNextFn = enqueueSongsNext,
  songsFromIdsFn = songsFromIds,
}: SongDatabaseActionHandlerDeps) {
  return async (e: SubmitEvent) => {
    e.preventDefault();

    const songIds = new FormData(e.target as HTMLFormElement).getAll('selected-song');
    const songs = songsFromIdsFn(dbState.db, songIds);

    const action = (e.submitter as HTMLButtonElement).getAttribute('data-action');
    switch (action) {
      case 'add-songs':
        return browseFileFn({ state, backendService, refreshDb });

      case 'edit-tags': {
        const tagsToUpdate = (await editId3TagsFn(songs)) as Partial<SongMetadata> | null | undefined;
        if (tagsToUpdate) {
          const dbCopy = await saveUpdatedSongsFn(backendService, [...dbState.db], songs, tagsToUpdate);
          dbState.db = dbCopy;
        }
        break;
      }

      case 'play-now':
        enqueueSongsNextFn(state, songs);
        state.lastEvent = new CustomEvent('next-song');
        break;

      case 'delete':
        songs.forEach(async song => await onRemoveSong(song));
        break;

      case 'add-to-playlist-option':
        return addSongsToPlaylist((e.submitter as HTMLButtonElement).getAttribute('data-playlist-id'), songs);

      case 'group-by-option': {
        const previousGroupBy = getCurrentGroupBy();
        if (previousGroupBy) {
          const { [previousGroupBy]: _, ...restFilters } = state.dbFilters;
          state.dbFilters = restFilters;
        }

        const groupByValue = (e.submitter as HTMLButtonElement).getAttribute('data-group-by') as SongMetadataAttribute;
        state.groupBy = groupByValue ? [{ name: groupByValue, selected: null, sortBy: 'valueAsec' }] : [];
        return;
      }

      case 'group-sort-by': {
        const sortBy = (e.submitter as HTMLButtonElement).getAttribute('data-sort-by') as SongGroupSortBy;
        const sortGroupName = (e.submitter as HTMLButtonElement).getAttribute('data-group') as SongMetadataAttribute;
        if (sortGroupName && sortBy) {
          state.groupBy = state.groupBy.map(group => (group.name === sortGroupName ? { ...group, sortBy } : group));
        }
        return;
      }

      case 'group-select': {
        const button = e.submitter as HTMLButtonElement;
        const itemName = button.getAttribute('title');
        const groupName = button.getAttribute('data-group');
        if (groupName && itemName) {
          state.dbFilters = { ...state.dbFilters, [groupName]: itemName };
        }
        return;
      }

      default:
        console.warn('Unknown action:', action);
        break;
    }

    return false;
  };
}
