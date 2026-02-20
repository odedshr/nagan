import { SongGroupsResponseItem, SongGroupsQueryItem } from './backend/backend';
import { StateTemplate } from './utils/Context';

export interface Player {
  setMetadata(data: { title: string; artist: string; image?: string; duration: number }): void;
  setCurrentTime(time: number): void;
  setFileSelectedHandler(handler: (file: File) => void): void;
  setAudioToggleHandler(handler: (isPlaying: boolean) => void): void;
  setPositionUpdateHandler(handler: (time: number) => void): void;
  getDivElement(): HTMLDivElement;
}

// Section represents a portion of a song to play
export interface Section {
  type: 'section';
  song: Song;
  startTime: number; // in seconds
  endTime: number; // in seconds
}

// QueueItem can be a song, section, or playlist
export type SongQueueItem = { type: 'song'; song: Song };
export type PlaylistQueueItem = { type: 'playlist'; playlist: Playlist };
export type QueueItem = SongQueueItem | Section | PlaylistQueueItem;
// Repeat modes
export type RepeatMode = 'none' | 'section' | 'song' | 'playlist';

export type Mode = 'database' | 'playlist' | 'notes';
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

export interface HistoryEntry {
  songId: string;
  durationPlayed: number; // total seconds played across all plays
  timesPlayed: number; // number of times song was played
  lastPlayed: number; // timestamp of last play
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
}>;

export type Group = {
  name: string;
  items: {
    name: string;
    count: number;
  }[];
  selected: string | number | null;
};

export type StateBase = {
  mode: 'database' | 'playlist' | 'notes';
  currentTrack: Song | null;
  playbackRate: number;
  volume: number;
  lastEvent?: CustomEvent;
  // DB system
  groupBy: SongGroupsQueryItem[];
  groups: SongGroupsResponseItem[];
  db: Song[];
  dbFilters: Record<string, unknown>;
  dbFilterArtist: string | null;
  // Playlist system
  playlists: Playlist[];
  currentPlaylistId: string | null;
  // Queue system
  queue: QueueItem[];
  repeat: RepeatMode;
  currentSection: Section | null;
  history: HistoryEntry[];
  // computed items:
  currentPlaylist: Playlist | null;
  playlistSongs: Song[];
  cssTheme: string;
};

export type State = StateTemplate<StateBase>;
