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
