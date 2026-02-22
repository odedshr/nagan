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

export function filterSongsByArtist(songs: Song[], artistFilter: string): Song[] {
  const filter = artistFilter.trim().toLowerCase();
  if (!filter) {
    return songs;
  }

  return songs.filter(song => {
    const artists = song.metadata.artists;
    const artistsText = Array.isArray(artists) ? artists.join(', ') : artists;
    return artistsText.toLowerCase().includes(filter);
  });
}
