import { invoke } from "@tauri-apps/api/core";
import { BackendService, GetSongsQuery, GetSongsResponse, Playlist, Song, SongMetadata } from "../types";

export default class TauriBackendService implements BackendService {
  async createPlaylist(name: string): Promise<Playlist> {
    return await invoke<Playlist>("create_playlist", { name });
  }
  async getSongs(query: GetSongsQuery): Promise<GetSongsResponse> {
    return await invoke<GetSongsResponse>("get_songs", { query });
  }
  
  async addSong(filePath: string, metadata: SongMetadata): Promise<Song> {
    return await invoke<Song>("add_song", { filePath, metadata });
  }

  async getPlaylists(query: {}): Promise<Playlist[]> {
    return await invoke<Playlist[]>("get_playlists", { query });
  }
}