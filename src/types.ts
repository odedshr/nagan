import { StateTemplate } from "./Context";

export interface Player {
    setMetadata(data: {
        title: string;
        artist: string;
        image?: string;
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