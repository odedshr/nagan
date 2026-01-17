
import { AddSongToPlaylistPayload, BackendService, GetPlaylistSongsQuery, GetPlaylistsQuery, GetSongsQuery, GetSongsResponse, Playlist, RemoveSongFromPlaylistPayload, Song, SongMetadata } from "../types";

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
  getSongs(query: GetSongsQuery): Promise<GetSongsResponse> {
    console.error('getSongs not implemented in WebBackendService');
    return Promise.resolve({ songs: [], total: 0 });
  }

  async addSong(filePath: string, metadata: SongMetadata): Promise<Song> {
    console.error('not implemented yet: addSong');
    return Promise.resolve({
      id: '0',
      title: metadata.title,
      artists: metadata.artists,
      album: metadata.album,
      duration: metadata.duration,
      file_path: filePath,
      file_exists: true,
      times_played: 0,
      genres: metadata.genres,
      tags: metadata.tags,
    } as unknown as Song);
  }
}