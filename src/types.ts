import { RemoveSongFromPlaylistPayload } from './types';
import { IPicture } from "music-metadata";
import { StateTemplate } from "./Context";

export interface Player {
    setMetadata(data: {
        title: string;
        artist: string;
        picture: IPicture[];
        duration: number;
    }): void;
    setCurrentTime(time: number): void;
    setFileSelectedHandler(handler: (file: File) => void): void;
    setAudioToggleHandler(handler: (isPlaying: boolean) => void): void;
    setPositionUpdateHandler(handler: (time: number) => void): void;
    getDivElement(): HTMLDivElement;
}

export type Mode = "database" | "playlist" | "notes";
// Core Data Models
export interface SongMetadata {
    title: string;
    album: string;
    year?: number;
    track?: number;
    image?: string;
    duration: number;
    artists: string | string[];
    instruments?: string[];
    bpm?: number;
    genres: string[];
    comment?: string;
    tags: string[];
    file_exists: boolean;
    times_played: number;
    picture: IPicture[];
}

export interface Song {
    id: string;
    url: string;
    filename: string;
    metadata: SongMetadata;
    available: boolean;
}

export interface Playlist {
    id: string;
    name: string;
    tags: string[];
    totalDuration: number;
}

export interface Marker {
    id: string;
    song: string;
    start: number;
    end?: number;
    comment?: string;
    color?: string;
}

// API Request/Response Types
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
    playlist_id: string;
    song_ids: string[];
}

export interface AddMarkerPayload {
    song_id: string;
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
    addSong(filePath: string, metadata: SongMetadata): Promise<Song>;
    getPlaylists(query: GetPlaylistsQuery): Promise<Playlist[]>;
    createPlaylist(name: string): Promise<Playlist>;
    deletePlaylist(playlistId: string): Promise<void>;
    addSongToPlaylist(payload: AddSongToPlaylistPayload): Promise<void>;
    removeSongFromPlaylist(payload: RemoveSongFromPlaylistPayload): Promise<boolean>;
    getPlaylistSongs(query: GetPlaylistSongsQuery): Promise<Song[]>;
    // updateSong(payload: UpdateSongPayload): Promise<Song>;
    // bulkUpdateSongs(payload: BulkUpdateSongsPayload): Promise<number>;
    // updatePlaylist(payload: UpdatePlaylistPayload): Promise<Playlist>;
    // reorderPlaylistSongs(payload: ReorderPlaylistSongsPayload): Promise<void>;
    // addMarker(payload: AddMarkerPayload): Promise<Marker>;
    // updateMarker(payload: UpdateMarkerPayload): Promise<Marker>;
    // calculateSimilarity(songId: string, topN: number): Promise<CalculateSimilarityResponse>
}

export interface TauriFile extends File {
    path: string;
}

export type FileDropEvent = CustomEvent<{
    type: 'files-dropped';
    files: File[];
}>;

export type FileLoadedEvent = CustomEvent<{
    type: 'file-loaded';
    file: File;
    metadata: SongMetadata;
}> ;

export type StateBase = {
    mode: "database" | "playlist" | "notes";
    currentTrack: Song | null;
    playbackRate: number;
    volume: number;
    lastEvent?: CustomEvent;
    db: Song[];
    playlists: Playlist[];
    currentPlaylistId: string | null;
    // computed items:
    currentPlaylist: Playlist | null;
    playlistSongs: Song[];
}

export type State = StateTemplate<StateBase>;