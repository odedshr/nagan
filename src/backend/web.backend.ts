import {
  AddSongToPlaylistPayload,
  BackendService,
  BulkUpdateSongsPayload,
  GetSongsGroupsQuery,
  GetSongsGroupsResponse,
  GetPlaylistSongsQuery,
  GetPlaylistsQuery,
  GetSongsQuery,
  GetSongsResponse,
  RemoveSongFromPlaylistPayload,
  ReorderPlaylistSongsPayload,
  UpdateSongPayload,
} from './backend';
import { Playlist, Song } from '../types';

export default class WebBackendService implements BackendService {
  getSongBpm(songId: string): Promise<number | null> {
    console.error('Method not implemented.', songId);
    return Promise.resolve(null);
  }

  getSongsGroups(query: GetSongsGroupsQuery): Promise<GetSongsGroupsResponse> {
    console.error('getSongsGroups not implemented in WebBackendService', query);
    return Promise.resolve({ groups: [] });
  }

  updateSong(payload: UpdateSongPayload): Promise<Song | null> {
    console.error('Method not implemented.', payload);
    return Promise.resolve(null);
  }

  removeSongFromPlaylist(payload: RemoveSongFromPlaylistPayload): Promise<boolean> {
    console.error('Method not implemented.', payload);
    return Promise.resolve(false);
  }
  getPlaylistSongs(query: GetPlaylistSongsQuery): Promise<Song[]> {
    console.error('Method not implemented.', query);
    return Promise.resolve([]);
  }
  deletePlaylist(playlistId: string): Promise<void> {
    console.error('Method not implemented.', playlistId);
    return Promise.resolve();
  }
  createPlaylist(name: string): Promise<Playlist> {
    console.error('Method not implemented.', name);
    return Promise.resolve({} as Playlist);
  }

  getPlaylists(query: GetPlaylistsQuery): Promise<Playlist[]> {
    console.error('Method not implemented.', query);
    return Promise.resolve([]);
  }
  addSongToPlaylist(payload: AddSongToPlaylistPayload): Promise<void> {
    console.error('Method not implemented.', payload);
    return Promise.resolve();
  }

  reorderPlaylistSongs(payload: ReorderPlaylistSongsPayload): Promise<boolean> {
    console.error('Method not implemented.', payload);
    return Promise.resolve(false);
  }

  shufflePlaylist(playlistId: string): Promise<boolean> {
    console.error('Method not implemented.', playlistId);
    return Promise.resolve(false);
  }

  getSongs(query: GetSongsQuery): Promise<GetSongsResponse> {
    console.error('getSongs not implemented in WebBackendService', query);
    return Promise.resolve({ songs: [], total: 0 });
  }

  async addSong(filePath: string): Promise<Song> {
    console.error('not implemented yet: addSong', filePath);
    return Promise.resolve({
      id: '0',
      file_path: filePath,
      file_exists: true,
      times_played: 0,
    } as unknown as Song);
  }

  deleteSong(songId: string): Promise<boolean> {
    console.error('not implemented yet: deleteSong', songId);
    return Promise.resolve(false);
  }

  bulkUpdateSongs(payload: BulkUpdateSongsPayload): Promise<number> {
    console.error('Method not implemented.', payload);
    return Promise.resolve(0);
  }
}
