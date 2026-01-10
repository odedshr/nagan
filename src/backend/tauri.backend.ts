import { invoke } from "@tauri-apps/api/core";
import { BackendService, GetSongsQuery, GetSongsResponse, Song, SongMetadata } from "../types";

export default class TauriBackendService implements BackendService {
  async getSongs(query: GetSongsQuery): Promise<GetSongsResponse> {
    return await invoke<GetSongsResponse>("get_songs", { query });
  }
  
  async addSong(filePath: string, metadata: SongMetadata): Promise<Song> {
    return await invoke<Song>("add_song", { filePath, metadata });
  }
}