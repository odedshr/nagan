import { invoke } from "@tauri-apps/api/core";
import { AddSongToPlaylistPayload, BackendService, GetPlaylistSongsQuery, GetPlaylistsQuery, GetSongsQuery, GetSongsResponse, Playlist, Song, SongMetadata } from "../types";

export default class TauriBackendService implements BackendService {
  // Playlist related methods
  async getPlaylists(query: GetPlaylistsQuery): Promise<Playlist[]> {
    return await invoke<Playlist[]>("get_playlists", { query });
  }

  async createPlaylist(name: string): Promise<Playlist> {
    return await invoke<Playlist>("create_playlist", { name });
  }

  async deletePlaylist(id: string): Promise<void> {
    await invoke<void>("delete_playlist", { id });
  }

  async getPlaylistSongs(query: GetPlaylistSongsQuery): Promise<Song[]> {
    return await invoke<Song[]>("get_playlist_songs", { query });
  }

  async addSongToPlaylist(payload: AddSongToPlaylistPayload): Promise<void> {
    console.log("Adding song to playlist via TauriBackendService:", payload);
    await invoke<void>("add_song_to_playlist", { payload });
  }

  // Song related methods
  async getSongs(query: GetSongsQuery): Promise<GetSongsResponse> {
    return await invoke<GetSongsResponse>("get_songs", { query });
  }
  
  async addSong(filePath: string, metadata: SongMetadata): Promise<Song> {
    return await invoke<Song>("add_song", { filePath, metadata });
  }
}