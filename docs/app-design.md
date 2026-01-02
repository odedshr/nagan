# Nagan

## General

Nagan is a PWA-based application to manage private music collection.
It's built using [Tauri](https://v2.tauri.app/start/create-project/) with Rust backend and vanilla typescript for the frontend.
The application contains four key panels: SongDatabase, PlaylistManager, PlaylistEditor, Player.

### Notes

- The app doesn't manage or contain the music files themselves, but reference to the location provided
- The app support local music files and files available online.

### SongDatabase

The application maintain a table of meta information regarding each song, with the following details:

- Song name
- Album name
- Publish year
- Track number
- Image (url, when not editing show the actual image)
- Duration
- Artist(s) names
- Instrument(s)
- BPM
- Genre(s)
- User comment
- User tags
- File exists (boolean)
- times played
- url/path to the file (column not visible in the UI)

Additionally, the application will maintain a vector table measuring the distance between each song listed.

#### SongDatabase Functionality

- User can add songs by dropping the files on the SongDatabase panel
- User can add a file via a browse window which allows them to paste a URL from which the songs can be played
- When adding a song, as much information will be extracted from its id3 tags and the rest can be manually inserted
- User can filter/sort by any columns
- User can remove items from the table, when doing so the user will be ask if they wish to remove the actual file as well
- User can refresh the table (in case files changed in the background); alternatively the table will be refresh if any of the music files is changed
- When updating song details, user will be asked if they wish to change the file id3 tags in a pop-up window
- User should be able to bulk-update files' information
- User should be able to bulk-rename files according to their information, template-based (e.g. "{{artist-name}} - {{song name}}.mp3")
- User can import/export the entire table

### PlaylistManager

The application maintain a simple table of playlists, with the following information -

- Playlist name
- Combined duration
- Songs count
- User customized tag(s)

#### PlaylistManager Functionality

- can add/remove/select playlist
- can filter/sort by any columns
- can import/export the entire table

### PlaylistEditor

For each playlist the application will keep a table with the relevant songs. Database - the table simply links the playlist to the songs. Display - show information as the SongDatabase

#### PlaylistEditor Functionality

- rename the playlist
- drag and drop to change the order of the songs
- drag and drop a file to add to the playlist
- auto-sort by songs' info or reverse the order
- shuffle the order
- get a random next song, taken at random from the 10 closest songs that weren't played yet
- a slim display will show two lines with song name + artist(s)

### Player

The player panel will give the user controls to play the songs

#### Player Functionality

- play/pause the song
- see the entire song duration and the current position
- scrub to a specific position in the song or by typing the current position
- navigate to previous/next songs
- choose to shuffle the next song
- see visualization of the songs volume
- control the songs speed using a scrub or a text-field
- add/remove markers that either single-point or section (start+stop)
- loop over marked sections
- navigate to previous/next marker
- write comments on the markers
- color markers
- show/hide markers

## Layout

1. Song Maintenance: SongDatabase + horizontal Player
2. Playlist Maintenance: PlaylistManager+ PlaylistEditor + horizontal Player
3. Song Annotator: slim PlaylistEditor + full Player
4. Minimal display: slim PlaylistEditor + horizontal Player

### Player horizontal mode

will show only the following:

- play/pause
- navigate to previous/next song
- duration + current position + scrubber
- shuffle next song

### Full Player mode

- When markers visible the markers comments will take vertical half of the panel
