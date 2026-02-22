import { invoke } from '@tauri-apps/api/core';
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

export default class TauriBackendService implements BackendService {
  // Playlist related methods
  async getPlaylists(query: GetPlaylistsQuery): Promise<Playlist[]> {
    return await invoke<Playlist[]>('get_playlists', { query });
  }

  async createPlaylist(name: string): Promise<Playlist> {
    return await invoke<Playlist>('create_playlist', { name });
  }

  async deletePlaylist(id: string): Promise<void> {
    await invoke<void>('delete_playlist', { id });
  }

  async getPlaylistSongs(query: GetPlaylistSongsQuery): Promise<Song[]> {
    return await invoke<Song[]>('get_playlist_songs', { query });
  }

  async addSongToPlaylist(payload: AddSongToPlaylistPayload): Promise<void> {
    await invoke<void>('add_song_to_playlist', { payload });
  }

  async removeSongFromPlaylist(payload: RemoveSongFromPlaylistPayload): Promise<boolean> {
    return await invoke<boolean>('remove_song_from_playlist', { payload });
  }

  async reorderPlaylistSongs(payload: ReorderPlaylistSongsPayload): Promise<boolean> {
    return invoke<boolean>('reorder_playlist_songs', { payload });
  }

  shufflePlaylist(playlistId: string): Promise<boolean> {
    return invoke<boolean>('shuffle_playlist', { playlistId });
  }

  // Song related methods
  async getSongs(query: GetSongsQuery): Promise<GetSongsResponse> {
    return await invoke<GetSongsResponse>('get_songs', { query });
  }

  async getSongsGroups(query: GetSongsGroupsQuery): Promise<GetSongsGroupsResponse> {
    return await invoke<GetSongsGroupsResponse>('get_song_groups', { query });
  }

  async addSong(filePath: string): Promise<Song> {
    return await invoke<Song>('add_song', { filePath });
  }

  async updateSong(payload: UpdateSongPayload): Promise<Song | null> {
    return await invoke<Song | null>('update_song', { payload });
  }

  deleteSong(id: string): Promise<boolean> {
    return invoke<boolean>('delete_song', { id });
  }

  async getSongBpm(songId: string): Promise<number | null> {
    return await invoke<number | null>('get_song_bpm', { songId });
  }

  async bulkUpdateSongs(payload: BulkUpdateSongsPayload): Promise<number> {
    return await invoke<number>('bulk_update_songs', { payload });
  }
}
