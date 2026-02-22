import { BackendService, SongGroupSortBy, SongMetadataAttribute } from '../backend/backend.ts';
import { enqueueSongsNext } from '../queue/queue-manager.ts';
import { DbSortDirection, DbSortItem, DbSortKey, Song, SongMetadata, State } from '../types.ts';
import editId3Tags, { Id3TagEditorResult } from './id3-tag-editor/id3-tag-editor.ts';
import { SongDatabaseState } from './song-database-state.ts';
import { browseFile, songsFromIds } from './add-songs.ts';
import { saveUpdatedSongs, saveUpdatedSongsPerSong } from './update-songs.ts';
import { getMusicBrainzGenres } from '../utils/musicbrainz.ts';
import { Notifier } from '../ui-components/notification/notifier.ts';

export type GetCurrentGroupBy = () => SongMetadataAttribute[];

export type SongDatabaseActionHandlerDeps = {
  state: State;
  dbState: SongDatabaseState;
  backendService: BackendService;
  notifier?: Notifier;
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
  notifier,
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
        const getSongGenres = async (songId: string): Promise<string[] | null> => {
          const s = songs.find(song => song.id === songId);
          if (!s) return null;
          return getMusicBrainzGenres({ title: s.metadata.title || s.filename, artists: s.metadata.artists });
        };

        const editResult = (await editId3TagsFn(
          songs,
          (songId: string) => backendService.getSongBpm(songId),
          getSongGenres,
          notifier
        )) as Id3TagEditorResult | null | undefined;

        if (editResult) {
          const { updatedTags, analyzedBpms, analyzedGenres } = editResult;

          let dbCopy = [...dbState.db];
          if (Object.keys(updatedTags).length > 0) {
            dbCopy = await saveUpdatedSongsFn(backendService, dbCopy, songs, updatedTags);
          }

          const updatesBySongId: Record<string, Partial<SongMetadata>> = {};

          if (analyzedBpms && Object.keys(analyzedBpms).length > 0 && updatedTags.bpm === undefined) {
            for (const [songId, bpm] of Object.entries(analyzedBpms)) {
              updatesBySongId[songId] = { ...(updatesBySongId[songId] ?? {}), bpm };
            }
          }

          if (analyzedGenres && Object.keys(analyzedGenres).length > 0 && updatedTags.genres === undefined) {
            for (const [songId, genres] of Object.entries(analyzedGenres)) {
              updatesBySongId[songId] = { ...(updatesBySongId[songId] ?? {}), genres };
            }
          }

          if (Object.keys(updatesBySongId).length > 0) {
            dbCopy = await saveUpdatedSongsPerSong(backendService, dbCopy, updatesBySongId);
          }

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
        const button = e.submitter as HTMLButtonElement;
        const multi = button.dataset.multi === '1';
        delete button.dataset.multi;

        const prevNames = getCurrentGroupBy();
        const groupByValue = button.getAttribute('data-group-by') as SongMetadataAttribute | null;

        let nextNames: SongMetadataAttribute[] = [];
        if (!groupByValue) {
          nextNames = [];
        } else if (!multi) {
          nextNames = [groupByValue];
        } else {
          if (prevNames.length === 0) {
            nextNames = [groupByValue];
          } else if (prevNames[0] === groupByValue) {
            // Ctrl-clicking the primary keeps it as primary.
            nextNames = prevNames.length > 1 ? [prevNames[0], prevNames[1]] : [prevNames[0]];
          } else if (prevNames[1] === groupByValue) {
            // Toggle off secondary.
            nextNames = [prevNames[0]];
          } else if (prevNames.length === 1) {
            const primaryFilter = state.dbFilters?.[prevNames[0]];
            const primaryHasSelection = typeof primaryFilter === 'string' || typeof primaryFilter === 'number';

            // If the primary group has no selected item yet, ignore the secondary selection for now.
            // (No error / warning; user can ctrl-select again after picking a primary item.)
            nextNames = primaryHasSelection ? [prevNames[0], groupByValue] : [prevNames[0]];
          } else {
            // Replace secondary.
            nextNames = [prevNames[0], groupByValue];
          }
        }

        const removed = prevNames.filter(name => !nextNames.includes(name));
        if (removed.length > 0) {
          const nextFilters = { ...state.dbFilters };
          for (const name of removed) {
            delete nextFilters[name];
          }
          state.dbFilters = nextFilters;
        }

        const prevByName = new Map(state.groupBy.map(g => [g.name, g] as const));
        state.groupBy = nextNames.map(name => {
          const existing = prevByName.get(name);
          const filterVal = state.dbFilters[name];
          const selected = typeof filterVal === 'string' || typeof filterVal === 'number' ? filterVal : null;
          return {
            name,
            selected,
            sortBy: existing?.sortBy ?? 'valueAsec',
          };
        });

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
          const nextFilters = { ...state.dbFilters, [groupName]: itemName };

          const idx = state.groupBy.findIndex(g => g.name === groupName);
          if (idx >= 0) {
            // If a preceding group changes selection, clear selections/filters of following groups.
            for (const g of state.groupBy.slice(idx + 1)) {
              delete nextFilters[g.name];
            }

            state.groupBy = state.groupBy.map((g, i) =>
              i < idx ? g : i === idx ? { ...g, selected: itemName } : { ...g, selected: null }
            );
          }

          state.dbFilters = nextFilters;
        }
        return;
      }

      case 'sort-by-option': {
        const button = e.submitter as HTMLButtonElement;
        const sortKey = button.getAttribute('data-sort-by') as DbSortKey | null;

        const multi = button.dataset.multi === '1';
        delete button.dataset.multi;

        if (!sortKey) {
          state.dbSort = [];
          return;
        }

        const prev = state.dbSort ?? [];
        const existingIdx = prev.findIndex(s => s.key === sortKey);
        const existing = existingIdx >= 0 ? prev[existingIdx] : undefined;

        const toggledDirection: DbSortDirection =
          existing?.direction === 'asc' ? 'desc' : existing?.direction === 'desc' ? 'asc' : 'asc';

        if (multi) {
          const next = [...prev];
          if (existingIdx === -1) {
            next.push({ key: sortKey, direction: 'asc' } satisfies DbSortItem);
          } else {
            next[existingIdx] = { ...next[existingIdx], direction: toggledDirection };
          }
          state.dbSort = next;
          return;
        }

        if (existingIdx === 0) {
          state.dbSort = [{ key: sortKey, direction: toggledDirection } satisfies DbSortItem];
          return;
        }

        state.dbSort = [
          {
            key: sortKey,
            direction: existing?.direction ?? 'asc',
          } satisfies DbSortItem,
        ];
        return;
      }

      default:
        console.warn('Unknown action:', action);
        break;
    }

    return false;
  };
}
