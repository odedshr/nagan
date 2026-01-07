import { IPicture } from "music-metadata";

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

export interface TrackMetadata {
    title: string;
    artist: string;
    picture: IPicture[];
    duration: number;
}

// Core Data Models
export interface SongMetadata {
    title: string;
    album: string;
    year?: number;
    track?: number;
    image?: string;
    duration: number;
    artists: string[];
    instruments?: string[];
    bpm?: number;
    genres: string[];
    comment?: string;
    tags: string[];
    fileExists: boolean;
    timesPlayed: number;
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
    playlist_id: string;
    sort?: string;
}

export interface AddSongToPlaylistPayload {
    playlist_id: string;
    song_id: string;
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