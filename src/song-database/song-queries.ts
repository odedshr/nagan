import type { BackendService, GetSongsQuery } from '../backend/backend.ts';
import type { Song, State } from '../types.ts';
import { dbSortToOrderBy } from './sort/db-sort.ts';

export async function fetchSongs(state: State, backendService: BackendService): Promise<Song[]> {
  try {
    const sort = dbSortToOrderBy(state.dbSort);
    const query: GetSongsQuery = { filters: state.dbFilters, ...(sort ? { sort } : {}) };
    const response = await backendService.getSongs(query);
    return response.songs;
  } catch (error) {
    console.error('Error fetching songs:', error);
  }

  return [];
}
