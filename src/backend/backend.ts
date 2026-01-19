import isTauri from "../is-tauri";
import { Playlist, Song, SongMetadata } from "../types";

export interface GetSongsQuery {
    filters?: Record<string, any>;
    sort?: string;
    limit?: number;
    offset?: number;
}

export interface GetSongsResponse {
    songs: Song[];
    total: number;
}

export interface UpdateSongPayload {
    id: string;
    metadata: Partial<SongMetadata>;
    update_id3?: boolean;
    filename?: string;
}

export interface BulkUpdateSongsPayload {
    ids: string[];
    updates: Partial<SongMetadata>;
    update_id3?: boolean;
}

export interface GetPlaylistsQuery {
    filters?: Record<string, any>;
    sort?: string;
}

export interface UpdatePlaylistPayload {
    id: string;
    name?: string;
    tags?: string[];
    songs?: string[];
}

export interface GetPlaylistSongsQuery {
    playlistId: string;
    sort?: string;
}

export interface AddSongToPlaylistPayload {
    playlistId: string;
    songId: string;
    position?: number;
}

export interface RemoveSongFromPlaylistPayload {
    playlistId: string;
    songId?: string;
    position?: number;
}

export interface ReorderPlaylistSongsPayload {
    playlistId: string;
    songIds: string[];
}

export interface AddMarkerPayload {
    songId: string;
    start: number;
    end?: number;
    comment?: string;
    color?: string;
}

export interface UpdateMarkerPayload {
    id: string;
    comment?: string;
    color?: string;
}

export interface SearchSongsQuery {
    query: string;
    fields?: string[];
}

export interface CalculateSimilarityResponse {
    similar: Song[];
    distances: number[];
}

export interface BackendService {
    getSongs(query: GetSongsQuery): Promise<GetSongsResponse>;
    addSong(filePath: string): Promise<Song>;
    deleteSong(songId: string): Promise<boolean>;
    getPlaylists(query: GetPlaylistsQuery): Promise<Playlist[]>;
    createPlaylist(name: string): Promise<Playlist>;
    deletePlaylist(playlistId: string): Promise<void>;
    addSongToPlaylist(payload: AddSongToPlaylistPayload): Promise<void>;
    removeSongFromPlaylist(payload: RemoveSongFromPlaylistPayload): Promise<boolean>;
    getPlaylistSongs(query: GetPlaylistSongsQuery): Promise<Song[]>;
    reorderPlaylistSongs(payload: ReorderPlaylistSongsPayload): Promise<boolean>;
    shufflePlaylist(playlistId: string): Promise<boolean>;
    // updateSong(payload: UpdateSongPayload): Promise<Song>;
    // bulkUpdateSongs(payload: BulkUpdateSongsPayload): Promise<number>;
    // updatePlaylist(payload: UpdatePlaylistPayload): Promise<Playlist>;
    // addMarker(payload: AddMarkerPayload): Promise<Marker>;
    // updateMarker(payload: UpdateMarkerPayload): Promise<Marker>;
    // calculateSimilarity(songId: string, topN: number): Promise<CalculateSimilarityResponse>
}

export async function getBackendService() {
  const backendServiceModule =  await import(
    isTauri() ? "./tauri.backend.ts" : "./web.backend.ts"
  );
  return new backendServiceModule.default() as BackendService;
}