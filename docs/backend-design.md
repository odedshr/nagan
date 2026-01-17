# Backend Design

## File Management

- Extract metadata from audio files (ID3 tags)
- Read file properties (duration, format)
- Handle file operations (add, remove, rename with templates)
- Monitor file system changes and detect when files have been modified or deleted
- Support drag-and-drop file handling

## Data Management

- Maintain a song database with all metadata fields and reference to file location/url
- Calculate distance/similarity metrics between songs (for the "10 closest songs" feature)
- Manage playlist data and associations
- Support importing/exporting database and playlist tables

## Metadata Operations

- Read ID3 tags from audio files
- Update ID3 tags when song information is modified
- Bulk-update file metadata
- Template-based file renaming (e.g., "{{artist-name}} - {{song name}}")

## Database Persistence

- Store song metadata persistently
- Store playlist information and song-playlist relationships
- Track play counts (statistics: partial-play and full-played) and markers (timestamps + comments)
- Preserve user tags and comments
- Search & Filtering
- Support filtering/sorting by any database column
- Generate query parameters for workspace search

## API Endpoints

The backend exposes Tauri commands for data retrieval and sending, enabling frontend interactions for song management, playlists, playback, and file operations.

### Data Objects

    - Song: id:string, url/filepath:string, filename:string, metadata:Metadata, available:boolean
        1. the database doesn't contain a copy of the audio content
        2. if the actual file is not available then available = false
    - Playlist: id:string, name:string, tags: string[], totalDuration:number
        1. Doesn't include the actual song list
    - Marker: id:string, song:string, start:timestamp, end:timestamp, comment:string, color:string

### Song Management

- **get_songs**
    (query: { filters?: object, sort?: string, limit?: number, offset?: number }) -> { songs: Song[], total: number }
    Retrieve paginated/filtered/sorted list of songs from the database.
- **add_song**
    (file: File) -> Song
    Add a new song, extract metadata if not provided, return the created song object.
- **update_song**
    (payload: { id: string, metadata: SongMetadata, update_id3?: boolean, filename?:string }) -> Song
    Update song metadata, optionally update ID3 tags (the actual file), return updated song.
- **delete_song**
    (payload: { id: string, delete_file?: boolean }) -> boolean
    Delete song from database, optionally remove file, return success.
- **bulk_update_songs**
    (payload: { ids: string[], updates: SongMetadata, update_id3?: boolean }) -> number
    Bulk update multiple songs, return count of updated.
- **import_songs**
    (payload: { file_path: string }) -> number
    Import songs from file (e.g., JSON/CSV), return count imported.
- **export_songs**
    (payload: { file_path: string, filters?: object }) -> boolean
    Opens "Save as" dialog, export songs to file, return success.

### Playlist Management

- **get_playlists**
    (query: { filters?: object, sort?: string }) -> Playlist[]
    Retrieve list of playlists.
- **create_playlist**
    (payload: { name: string, tags?: string[] }) -> Playlist
    Create new playlist, return created object.
- **update_playlist**
    (payload: { id: string, name?: string, tags?: string[], songs?:string[] }) -> Playlist
    Update playlist info, return updated.
- **delete_playlist**
    (payload: { id: string }) -> boolean
    Delete playlist, return success.
- **get_playlist_songs**
    (query: { playlist_id: string, sort?: string }) -> Song[]
    Get songs in a playlist, with optional sorting.
- **add_song_to_playlist**
    (payload: { playlist_id: string, song_id: string, position?: number }) -> boolean
    Add song to playlist at position, return success.
    If position is undefined, add to the end of the list;
    If position is negative, add from the end of the list (so -1 would be last item, -2 would be an item before the last);
    If position value > playlist.length, add to end of list;
    If position is negative but smaller than negative playlist.length, add as first position.
- **remove_song_from_playlist**
    (payload: { playlist_id: string, song_id?: string, position?: number }) -> boolean
    Remove song from playlist, return success.
    if both song_id and position not provided, return false
    if song_id provided, remove all instances of the song from the playlist
    if only position provided, delete the song that is in that position
    if song_id and position provided, delete the song_id from that position only if indeed it matches
- **reorder_playlist_songs**
    (payload: { playlist_id: string, song_ids: string[] }) -> boolean
    Update song order in playlist, return success.
- **shuffle_playlist**
    (payload: { playlist_id: string }) -> string[]
    Shuffle songs in playlist, return new order of song IDs.
- **get_random_next**
    (payload: { playlist_id: string }) -> Song
    Get random next song based on similarity (10 closest not in current playlist), return song.

### Playback Control

- **load_song**
    (payload: { song_id: string }) -> { metadata: SongMetadata, url: string }:
    Load song for playback, return metadata and playable URL.

### Markers and Annotations

- **get_markers**
    (query: { song_id: string }) -> Marker[]
    Retrieve markers for a song (with timestamps, comments, colors).
- **add_marker**
    (payload: { song_id: string, start: number, end?: number, comment?: string, color?: string }) -> Marker
    Add marker (point or section), return created.
- **update_marker**
    (payload: { id: string, comment?: string, color?: string }) -> Marker
    Update marker, return updated.
- **remove_marker**
    (payload: { id: string }) -> boolean
    Delete marker, return success.

### Additional functionalities co-pilot mentioned

- **extract_metadata**
    (payload: { path: string }) -> SongMetadata
    Extract metadata from file, return object.
- **update_id3_tags**
    (payload: { path: string, metadata: SongMetadata }) -> boolean
    Update ID3 tags on file, return success.
- **rename_file**
    (payload: { path: string, template: string }) -> string
    Rename file using template (e.g., "{{artist}} - {{title}}.mp3"), return new path.
- **monitor_files**
    () -> EventStream
    Start monitoring file changes, emit events for additions/modifications/deletions.
- **search_songs**
    (query: { query: string, fields?: string[] }) -> Song[]
    Search songs by text across fields, return matches.
- **calculate_similarity**
    (payload: { song_id: string }) -> { similar: Song[], distances: number[] }
    Compute and return 10 closest songs with distances.
- **refresh_database**
    () -> boolean
    Refresh song database from file system changes, return success.
