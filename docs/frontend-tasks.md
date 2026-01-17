# Frontend Implementation Tasks

## Phase 1: Core Infrastructure (Week 1)

- [✅] Set up TypeScript types for State, Song, Playlist, and Player
- [✅] Implement Context/State management system with listeners
- [✅] Create basic navigation between 3 main views (Database, Playlist, Player)
- [✅] Implement view switching logic (already partially done in main.ts)

## Phase 2: Mini-Player (Week 1-2)

- [✅] Create player UI component with basic controls (play/pause, next/prev)
- [✅] Implement audio playback using Web Audio API or HTML5 Audio
- [✅] Add position scrubber and time display
- [✅] Add volume control
- [✅] Wire up player to accept songs from playlist

## Phase 3: Song Database - Read (Week 2)

- [✅] Create basic table component for displaying songs
- [✅] Implement table data rendering from backend
- [ ] Add basic filtering (search by title/artist)
- [ ] Add basic sorting (by column headers)

## Phase 4: Playlist Manager - Basic (Week 2-3)

- [ ] Create playlist table view
- [ ] Implement "Create New Playlist" functionality
- [ ] Implement "Select Playlist" functionality
- [ ] Display selected playlist songs in editor view

## Phase 5: Playlist Editor - [ ] Basic (Week 3)

- [ ] Display songs in selected playlist as table
- [ ] Implement drag-and-drop reordering within playlist
- [ ] Add "Remove from Playlist" button
- [ ] Connect playlist to player (play selected song)

## Phase 6: Song Database - [ ] Write (Week 3-4)

- [ ] Implement file upload (drag-and-drop or browse)
- [ ] Show upload progress and confirmation
- [ ] Implement "Remove Song" with confirmation dialog
- [ ] Add "Refresh" button to reload table

## Phase 7: Enhanced Playback (Week 4)

- [ ] Add shuffle functionality to player
- [ ] Implement "Next in Playlist" logic
- [ ] Add autoplay (continue to next song)
- [ ] Save/restore playback position

## Phase 8: Polish & UX (Week 5)

- [ ] Add loading states and error handling
- [ ] Implement responsive design for different screen sizes
- [ ] Add keyboard shortcuts (space for play/pause, arrows for seek)
- [ ] Add visual feedback for current playing song

## Phase 9: Advanced Features (Post-MVP)

- [ ] Inline metadata editing in database view
- [ ] Bulk operations UI
- [ ] Playlist filtering and advanced sorting
- [ ] Speed control and markers (full player features)
- [ ] Album art display and caching
-Nice-to-Have (Future)
- [ ] Import/export playlist data
- [ ] Multiple playlist selection
- [ ] Custom themes
- [ ] Visualization during playback