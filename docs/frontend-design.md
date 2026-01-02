# Frontend design

## UI Panels & Navigation

- SongDatabase panel: Table display with all song metadata columns
- PlaylistManager panel: Playlist table with name, duration, song count, tags
- PlaylistEditor panel: Playlist songs table with re-orderable rows
- Player panel: Playback controls and visualization
- Layout switching between 4 different views (Song Maintenance, Playlist Maintenance, Song Annotator, Minimal display)

## SongDatabase Features

- Display filterable/sortable table with 14+ columns
- Drag-and-drop file upload
- Browse/URL input dialog for adding songs
- Context menu to remove items (with confirmation)
- Refresh table functionality
- Inline metadata editing
- Pop-up to confirm ID3 tag updates
- Bulk-update UI
- Bulk-rename with template input
- Import/export table data

## PlaylistManager Features

- Display filterable/sortable playlist table
- Add/remove/select playlist buttons
- Playlist filtering and sorting UI

## PlaylistEditor Features

- Display songs in selected playlist
- Drag-and-drop to reorder songs
- Drag-and-drop to add files
- Auto-sort buttons (by metadata or reverse)
- Shuffle button
- "Random next" button for song suggestion

## Player Features

- Play/pause button
- Duration display + current position scrubber
- Manual position input (text field)
- Previous/next navigation
- Shuffle toggle
- Volume visualization
- Speed control (scrub + text field)
- Marker management (add/remove/navigate)
- Single-point and section markers
- Marker comments editor
- Marker color picker
- Marker visibility toggle
- Loop over marked sections
- Responsive layout (horizontal vs full mode)

## General Frontend Responsibilities

- State management (current playlist, current song, playback state)
- Form validation and user dialogs
- Real-time UI updates based on backend events
- Image lazy-loading and caching for album art
- Responsive design across 4 layout modes
