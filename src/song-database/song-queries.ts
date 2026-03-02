import type { BackendService, GetSongsQuery, GetSongsResponse } from '../backend/backend.ts';
import type { State } from '../types.ts';
import { dbSortToOrderBy } from './sort/db-sort.ts';

export async function fetchSongs(state: State, backendService: BackendService): Promise<GetSongsResponse> {
  try {
    const sort = dbSortToOrderBy(state.dbQuery.sort);

    const query: GetSongsQuery = {
      filters: state.dbQuery.filters,
      ...(sort ? { sort } : {}),
    };

    const pageSize = state.dbQuery.pageSize;
    const pageNumber = state.dbQuery.pageNumber;
    if (Number.isFinite(pageSize) && pageSize > 0) {
      query.limit = pageSize;
      query.offset = Math.max(0, pageNumber) * pageSize;
    }

    return await backendService.getSongs(query);
  } catch (error) {
    console.error('Error fetching songs:', error);
  }

  return { songs: [], total: 0 };
}
