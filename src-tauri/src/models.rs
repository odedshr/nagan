use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};

// Core Data Models

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Song {
    pub id: String,
    pub url: String,
    pub filename: String,
    pub metadata: SongMetadata,
    pub available: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct SongMetadata {
    pub title: String,
    pub album: String,
    pub year: Option<i32>,
    pub track: Option<i32>,
    pub image: Option<String>,
    pub duration: f64,
    pub artists: Vec<String>,
    pub instruments: Option<Vec<String>>,
    pub bpm: Option<f32>,
    pub genres: Vec<String>,
    pub comment: Option<String>,
    pub tags: Vec<String>,
    pub file_exists: bool,
    pub times_played: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Playlist {
    pub id: String,
    pub name: String,
    pub tags: Vec<String>,
    pub total_duration: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Marker {
    pub id: String,
    pub song: String,
    pub start: f64,
    pub end: Option<f64>,
    pub comment: Option<String>,
    pub color: Option<String>,
}

// Database Models (for SQLite storage)

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct DbSong {
    pub id: String,
    pub url: String,
    pub filename: String,
    pub title: String,
    pub album: String,
    pub year: Option<i32>,
    pub track: Option<i32>,
    pub image: Option<String>,
    pub duration: f64,
    pub artists: String, // JSON string
    pub instruments: Option<String>, // JSON string
    pub bpm: Option<f32>,
    pub genres: String, // JSON string
    pub comment: Option<String>,
    pub tags: String, // JSON string
    pub file_exists: bool,
    pub times_played: i32,
    pub available: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct DbPlaylist {
    pub id: String,
    pub name: String,
    pub tags: String, // JSON string
    pub total_duration: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct DbPlaylistSong {
    pub id: String,
    pub playlist_id: String,
    pub song_id: String,
    pub position: i32,
    pub added_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct DbMarker {
    pub id: String,
    pub song_id: String,
    pub start: f64,
    pub end: Option<f64>,
    pub comment: Option<String>,
    pub color: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// API Request/Response Types

#[derive(Debug, Deserialize)]
pub struct GetSongsQuery {
    pub filters: Option<serde_json::Value>,
    pub sort: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct GetSongsResponse {
    pub songs: Vec<Song>,
    pub total: i64,
}

#[derive(Debug, Deserialize, Clone)]
pub struct UpdateSongPayload {
    pub id: String,
    pub metadata: serde_json::Value,
    pub update_id3: Option<bool>,
    pub filename: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct BulkUpdateSongsPayload {
    pub ids: Vec<String>,
    pub updates: serde_json::Value,
    pub update_id3: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct GetPlaylistsQuery {
    pub filters: Option<serde_json::Value>,
    pub sort: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePlaylistPayload {
    pub id: String,
    pub name: Option<String>,
    pub tags: Option<Vec<String>>,
    pub songs: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct GetPlaylistSongsQuery {
    pub playlist_id: String,
    pub sort: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AddSongToPlaylistPayload {
    pub playlist_id: String,
    pub song_id: String,
    pub position: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct ReorderPlaylistSongsPayload {
    pub playlist_id: String,
    pub song_ids: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct AddMarkerPayload {
    pub song_id: String,
    pub start: f64,
    pub end: Option<f64>,
    pub comment: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMarkerPayload {
    pub id: String,
    pub comment: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SearchSongsQuery {
    pub query: String,
    pub fields: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
pub struct CalculateSimilarityResponse {
    pub similar: Vec<Song>,
    pub distances: Vec<f32>,
}

// Conversion functions

impl From<DbSong> for Song {
    fn from(db_song: DbSong) -> Self {
        Song {
            id: db_song.id,
            url: db_song.url,
            filename: db_song.filename,
            metadata: SongMetadata {
                title: db_song.title,
                album: db_song.album,
                year: db_song.year,
                track: db_song.track,
                image: db_song.image,
                duration: db_song.duration,
                artists: serde_json::from_str(&db_song.artists).unwrap_or_default(),
                instruments: db_song.instruments
                    .map(|s| serde_json::from_str(&s).unwrap_or_default()),
                bpm: db_song.bpm,
                genres: serde_json::from_str(&db_song.genres).unwrap_or_default(),
                comment: db_song.comment,
                tags: serde_json::from_str(&db_song.tags).unwrap_or_default(),
                file_exists: db_song.file_exists,
                times_played: db_song.times_played,
            },
            available: db_song.available,
        }
    }
}

impl From<DbPlaylist> for Playlist {
    fn from(db_playlist: DbPlaylist) -> Self {
        Playlist {
            id: db_playlist.id,
            name: db_playlist.name,
            tags: serde_json::from_str(&db_playlist.tags).unwrap_or_default(),
            total_duration: db_playlist.total_duration,
        }
    }
}

impl From<DbMarker> for Marker {
    fn from(db_marker: DbMarker) -> Self {
        Marker {
            id: db_marker.id,
            song: db_marker.song_id,
            start: db_marker.start,
            end: db_marker.end,
            comment: db_marker.comment,
            color: db_marker.color,
        }
    }
}