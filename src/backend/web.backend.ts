
import { AddSongToPlaylistPayload, BackendService, GetPlaylistSongsQuery, GetPlaylistsQuery, GetSongsQuery, GetSongsResponse, RemoveSongFromPlaylistPayload, ReorderPlaylistSongsPayload } from "./backend";
import { Playlist, Song, SongMetadata } from "../types";

export default class WebBackendService implements BackendService {
  removeSongFromPlaylist(payload: RemoveSongFromPlaylistPayload): Promise<boolean> {
    console.error("Method not implemented.");
    return Promise.resolve(false);
  }
  getPlaylistSongs(query: GetPlaylistSongsQuery): Promise<Song[]> {
    console.error("Method not implemented.");
    return Promise.resolve([]);
  }
  deletePlaylist(playlistId: string): Promise<void> {
    console.error("Method not implemented.");
    return Promise.resolve();
  }
  createPlaylist(name: string): Promise<Playlist> {
    console.error("Method not implemented.");
    return Promise.resolve({} as Playlist);
  }
  
  getPlaylists(query: GetPlaylistsQuery): Promise<Playlist[]> {
    console.error("Method not implemented.");
    return Promise.resolve([]);
  }
  addSongToPlaylist(payload: AddSongToPlaylistPayload): Promise<void> {
    console.error("Method not implemented.");
    return Promise.resolve();
  }
  
  reorderPlaylistSongs(payload: ReorderPlaylistSongsPayload): Promise<boolean> {
    console.error("Method not implemented.");
    return Promise.resolve(false);
  }

  shufflePlaylist(playlistId: string): Promise<boolean> {
    console.error("Method not implemented.");
    return Promise.resolve(false);
  }

  getSongs(query: GetSongsQuery): Promise<GetSongsResponse> {
    console.error('getSongs not implemented in WebBackendService');
    return Promise.resolve({ songs: [], total: 0 });
  }

  async addSong(filePath: string): Promise<Song> {
    console.error('not implemented yet: addSong');
    return Promise.resolve({
      id: '0',
      file_path: filePath,
      file_exists: true,
      times_played: 0,
    } as unknown as Song);
  }

  deleteSong(songId: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}