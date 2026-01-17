use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

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
    pub artists: String,             // JSON string
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

#[allow(dead_code)]
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

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
pub struct UpdatePlaylistPayload {
    pub id: String,
    pub name: Option<String>,
    pub tags: Option<Vec<String>>,
    pub songs: Option<Vec<String>>,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetPlaylistSongsQuery {
    pub playlist_id: String,
    pub sort: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddSongToPlaylistPayload {
    pub playlist_id: String,
    pub song_id: String,
    pub position: Option<i32>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoveSongFromPlaylistPayload {
    pub playlist_id: String,
    pub song_id: Option<String>,
    pub position: Option<i32>,
}

#[allow(dead_code)]
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

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
pub struct UpdateMarkerPayload {
    pub id: String,
    pub comment: Option<String>,
    pub color: Option<String>,
}

#[allow(dead_code)]
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
                instruments: db_song
                    .instruments
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_song_creation() {
        let song = Song {
            id: "test-id".to_string(),
            url: "/path/to/song.mp3".to_string(),
            filename: "song.mp3".to_string(),
            metadata: SongMetadata {
                title: "Test Song".to_string(),
                album: "Test Album".to_string(),
                year: Some(2023),
                track: Some(1),
                image: None,
                duration: 180.0,
                artists: vec!["Test Artist".to_string()],
                instruments: None,
                bpm: Some(120.0),
                genres: vec!["Rock".to_string()],
                comment: None,
                tags: vec![],
                file_exists: true,
                times_played: 0,
            },
            available: true,
        };

        assert_eq!(song.id, "test-id");
        assert_eq!(song.metadata.title, "Test Song");
        assert_eq!(song.metadata.duration, 180.0);
    }

    #[test]
    fn test_playlist_creation() {
        let playlist = Playlist {
            id: "playlist-1".to_string(),
            name: "My Playlist".to_string(),
            tags: vec!["chill".to_string(), "workout".to_string()],
            total_duration: 3600.0,
        };

        assert_eq!(playlist.name, "My Playlist");
        assert_eq!(playlist.tags.len(), 2);
        assert_eq!(playlist.total_duration, 3600.0);
    }

    #[test]
    fn test_marker_creation() {
        let marker = Marker {
            id: "marker-1".to_string(),
            song: "song-1".to_string(),
            start: 30.5,
            end: Some(45.2),
            comment: Some("Chorus".to_string()),
            color: Some("#FF0000".to_string()),
        };

        assert_eq!(marker.start, 30.5);
        assert_eq!(marker.end, Some(45.2));
        assert_eq!(marker.comment, Some("Chorus".to_string()));
    }

    #[test]
    fn test_dbsong_to_song_conversion() {
        let db_song = DbSong {
            id: "test-id".to_string(),
            url: "/path/to/song.mp3".to_string(),
            filename: "song.mp3".to_string(),
            title: "Test Song".to_string(),
            album: "Test Album".to_string(),
            year: Some(2023),
            track: Some(1),
            image: None,
            duration: 180.0,
            artists: r#"["Artist 1","Artist 2"]"#.to_string(),
            instruments: Some(r#"["Guitar","Drums"]"#.to_string()),
            bpm: Some(120.0),
            genres: r#"["Rock","Pop"]"#.to_string(),
            comment: Some("Great song".to_string()),
            tags: r#"["favorite"]"#.to_string(),
            file_exists: true,
            times_played: 5,
            available: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let song: Song = db_song.into();
        assert_eq!(song.metadata.artists.len(), 2);
        assert_eq!(song.metadata.genres.len(), 2);
        assert_eq!(song.metadata.times_played, 5);
    }

    #[test]
    fn test_dbplaylist_to_playlist_conversion() {
        let db_playlist = DbPlaylist {
            id: "playlist-1".to_string(),
            name: "Test Playlist".to_string(),
            tags: r#"["tag1","tag2"]"#.to_string(),
            total_duration: 1200.0,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let playlist: Playlist = db_playlist.into();
        assert_eq!(playlist.name, "Test Playlist");
        assert_eq!(playlist.tags.len(), 2);
        assert_eq!(playlist.total_duration, 1200.0);
    }

    #[test]
    fn test_dbmarker_to_marker_conversion() {
        let db_marker = DbMarker {
            id: "marker-1".to_string(),
            song_id: "song-1".to_string(),
            start: 10.0,
            end: Some(20.0),
            comment: Some("Verse".to_string()),
            color: Some("#00FF00".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let marker: Marker = db_marker.into();
        assert_eq!(marker.song, "song-1");
        assert_eq!(marker.start, 10.0);
        assert_eq!(marker.comment, Some("Verse".to_string()));
    }

    #[test]
    fn test_song_metadata_serialization() {
        let metadata = SongMetadata {
            title: "Test".to_string(),
            album: "Album".to_string(),
            year: Some(2023),
            track: Some(1),
            image: None,
            duration: 180.0,
            artists: vec!["Artist".to_string()],
            instruments: None,
            bpm: Some(120.0),
            genres: vec!["Rock".to_string()],
            comment: None,
            tags: vec![],
            file_exists: true,
            times_played: 0,
        };

        let json = serde_json::to_string(&metadata).unwrap();
        let deserialized: SongMetadata = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.title, metadata.title);
        assert_eq!(deserialized.duration, metadata.duration);
    }

    #[test]
    fn test_get_songs_query_defaults() {
        let query = GetSongsQuery {
            filters: None,
            sort: None,
            limit: None,
            offset: None,
        };

        assert!(query.filters.is_none());
        assert!(query.sort.is_none());
    }

    #[test]
    fn test_update_song_payload_clone() {
        let payload = UpdateSongPayload {
            id: "song-1".to_string(),
            metadata: serde_json::json!({"title": "New Title"}),
            update_id3: Some(true),
            filename: Some("new_name.mp3".to_string()),
        };

        let cloned = payload.clone();
        assert_eq!(cloned.id, payload.id);
        assert_eq!(cloned.update_id3, payload.update_id3);
    }
}
