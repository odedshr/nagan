use serde_json;
use tauri::State;
use uuid::Uuid;

use crate::database::Database;
use crate::models::*;
use crate::AppState;

// Keep original greet command for compatibility
#[tauri::command]
pub async fn greet(name: &str) -> Result<String, String> {
    Ok(format!("Hello, {}! You've been greeted from Rust!", name))
}

// Song Management Commands

#[tauri::command]
pub async fn get_songs(
    query: GetSongsQuery,
    state: State<'_, AppState>,
) -> Result<GetSongsResponse, String> {
    let db: &Database = &*state.db.lock().await;
    db.get_songs(query)
        .await
        .map_err(|e: sqlx::Error| e.to_string())
}

#[tauri::command]
pub async fn add_song(file_path: String, metadata: SongMetadata,state: State<'_, AppState>) -> Result<Song, String> {
    let song_id = Uuid::new_v4().to_string();
    let filename = std::path::Path::new(&file_path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    let song = Song {
        id: song_id,
        url: file_path,
        filename,
        metadata,
        available: true,
    };

    let db = state.db.lock().await;
    db.create_song(song.clone())
        .await
        .map_err(|e| e.to_string())?;
    Ok(song)
}

#[tauri::command]
pub async fn update_song(
    payload: UpdateSongPayload,
    state: State<'_, AppState>,
) -> Result<Option<Song>, String> {
    let db = state.db.lock().await;
    db.update_song(&payload.id.clone(), payload)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_song(
    id: String,
    delete_file: Option<bool>,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let db = state.db.lock().await;

    // If delete_file is true, we would need to implement file deletion logic
    if delete_file.unwrap_or(false) {
        // TODO: Implement actual file deletion
        log::warn!("File deletion not implemented yet");
    }

    db.delete_song(&id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn bulk_update_songs(
    payload: BulkUpdateSongsPayload,
    state: State<'_, AppState>,
) -> Result<i32, String> {
    let mut updated_count = 0;
    let db = state.db.lock().await;

    for song_id in payload.ids {
        let update_payload = UpdateSongPayload {
            id: song_id.clone(),
            metadata: payload.updates.clone(),
            update_id3: payload.update_id3,
            filename: None,
        };

        if db.update_song(&song_id, update_payload).await.is_ok() {
            updated_count += 1;
        }
    }

    Ok(updated_count)
}

// Playlist Management Commands

#[tauri::command]
pub async fn get_playlists(
    query: GetPlaylistsQuery,
    state: State<'_, AppState>,
) -> Result<Vec<Playlist>, String> {
    let db = state.db.lock().await;
    db.get_playlists(query).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_playlist(
    name: String,
    tags: Option<Vec<String>>,
    state: State<'_, AppState>,
) -> Result<Playlist, String> {
    let playlist_id = Uuid::new_v4().to_string();
    let playlist = Playlist {
        id: playlist_id,
        name,
        tags: tags.unwrap_or_default(),
        total_duration: 0.0,
    };

    let db = state.db.lock().await;
    db.create_playlist(playlist.clone())
        .await
        .map_err(|e| e.to_string())?;
    Ok(playlist)
}

// Playback Control Commands

#[tauri::command]
pub async fn load_song(
    song_id: String,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().await;
    let song = db
        .get_song_by_id(&song_id)
        .await
        .map_err(|e| e.to_string())?;

    if let Some(song) = song {
        Ok(serde_json::json!({
            "metadata": song.metadata,
            "url": song.url
        }))
    } else {
        Err("Song not found".to_string())
    }
}

// Markers and Annotations Commands

#[tauri::command]
pub async fn get_markers(
    song_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<Marker>, String> {
    let db = state.db.lock().await;
    db.get_markers(&song_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_marker(
    payload: AddMarkerPayload,
    state: State<'_, AppState>,
) -> Result<Marker, String> {
    let marker_id = Uuid::new_v4().to_string();
    let marker = Marker {
        id: marker_id,
        song: payload.song_id,
        start: payload.start,
        end: payload.end,
        comment: payload.comment,
        color: payload.color,
    };

    let db = state.db.lock().await;
    db.create_marker(marker.clone())
        .await
        .map_err(|e| e.to_string())?;
    Ok(marker)
}

// Placeholder implementations for remaining functions

#[tauri::command]
pub async fn import_songs() -> Result<i32, String> {
    // TODO: Implement JSON/CSV import logic
    log::warn!("Song import not implemented yet");
    Ok(0)
}

#[tauri::command]
pub async fn export_songs() -> Result<bool, String> {
    // TODO: Implement JSON/CSV export logic with save dialog
    log::warn!("Song export not implemented yet");
    Ok(true)
}

#[tauri::command]
pub async fn extract_metadata() -> Result<SongMetadata, String> {
    // TODO: Implement actual metadata extraction using music-metadata crate
    log::warn!("Metadata extraction not implemented yet");

    Ok(SongMetadata {
        title: "Extracted Title".to_string(),
        album: "Extracted Album".to_string(),
        year: Some(2023),
        track: Some(1),
        image: None,
        duration: 180.0,
        artists: vec!["Extracted Artist".to_string()],
        instruments: None,
        bpm: Some(120.0),
        genres: vec!["Pop".to_string()],
        comment: None,
        tags: vec![],
        file_exists: true,
        times_played: 0,
    })
}

#[tauri::command]
pub async fn update_id3_tags() -> Result<bool, String> {
    // TODO: Implement ID3 tag updating
    log::warn!("ID3 tag updating not implemented yet");
    Ok(true)
}

#[tauri::command]
pub async fn rename_file() -> Result<String, String> {
    // TODO: Implement template-based file renaming
    log::warn!("File renaming not implemented yet");
    Ok("placeholder".to_string())
}

#[tauri::command]
pub async fn update_playlist() -> Result<Option<Playlist>, String> {
    // TODO: Implement playlist update logic
    log::warn!("Playlist update not implemented yet");
    Ok(None)
}

#[tauri::command]
pub async fn delete_playlist() -> Result<bool, String> {
    // TODO: Implement playlist deletion
    log::warn!("Playlist deletion not implemented yet");
    Ok(true)
}

#[tauri::command]
pub async fn get_playlist_songs() -> Result<Vec<Song>, String> {
    // TODO: Implement getting songs from playlist
    log::warn!("Get playlist songs not implemented yet");
    Ok(vec![])
}

#[tauri::command]
pub async fn add_song_to_playlist() -> Result<bool, String> {
    // TODO: Implement adding song to playlist
    log::warn!("Add song to playlist not implemented yet");
    Ok(true)
}

#[tauri::command]
pub async fn remove_song_from_playlist() -> Result<bool, String> {
    // TODO: Implement removing song from playlist
    log::warn!("Remove song from playlist not implemented yet");
    Ok(true)
}

#[tauri::command]
pub async fn reorder_playlist_songs() -> Result<bool, String> {
    // TODO: Implement reordering playlist songs
    log::warn!("Reorder playlist songs not implemented yet");
    Ok(true)
}

#[tauri::command]
pub async fn shuffle_playlist() -> Result<Vec<String>, String> {
    // TODO: Implement playlist shuffling
    log::warn!("Shuffle playlist not implemented yet");
    Ok(vec![])
}

#[tauri::command]
pub async fn get_random_next() -> Result<Option<Song>, String> {
    // TODO: Implement random next song based on similarity
    log::warn!("Get random next not implemented yet");
    Ok(None)
}

#[tauri::command]
pub async fn update_marker() -> Result<Option<Marker>, String> {
    // TODO: Implement marker update
    log::warn!("Marker update not implemented yet");
    Ok(None)
}

#[tauri::command]
pub async fn remove_marker() -> Result<bool, String> {
    // TODO: Implement marker deletion
    log::warn!("Marker deletion not implemented yet");
    Ok(true)
}

#[tauri::command]
pub async fn monitor_files() -> Result<String, String> {
    // TODO: Implement file system monitoring
    log::warn!("File monitoring not implemented yet");
    Ok("monitoring_started".to_string())
}

#[tauri::command]
pub async fn search_songs() -> Result<Vec<Song>, String> {
    // TODO: Implement song search
    log::warn!("Song search not implemented yet");
    Ok(vec![])
}

#[tauri::command]
pub async fn calculate_similarity() -> Result<CalculateSimilarityResponse, String> {
    // TODO: Implement similarity calculation
    log::warn!("Similarity calculation not implemented yet");
    Ok(CalculateSimilarityResponse {
        similar: vec![],
        distances: vec![],
    })
}

#[tauri::command]
pub async fn refresh_database() -> Result<bool, String> {
    // TODO: Implement database refresh from file system
    log::warn!("Database refresh not implemented yet");
    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_greet_command() {
        let result = greet("World").await;
        assert!(result.is_ok());
        assert_eq!(
            result.unwrap(),
            "Hello, World! You've been greeted from Rust!"
        );
    }

    #[tokio::test]
    async fn test_greet_with_empty_name() {
        let result = greet("").await;
        assert!(result.is_ok());
        assert!(result.unwrap().contains("Hello, !"));
    }

    #[tokio::test]
    async fn test_greet_with_special_characters() {
        let result = greet("Test123!@#").await;
        assert!(result.is_ok());
        assert!(result.unwrap().contains("Test123!@#"));
    }

    #[test]
    fn test_song_metadata_creation() {
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

        assert_eq!(metadata.title, "Test");
        assert_eq!(metadata.duration, 180.0);
        assert_eq!(metadata.artists.len(), 1);
    }

    #[test]
    fn test_update_song_payload_creation() {
        let payload = UpdateSongPayload {
            id: "song-1".to_string(),
            metadata: serde_json::json!({"title": "New Title"}),
            update_id3: Some(true),
            filename: Some("new.mp3".to_string()),
        };

        assert_eq!(payload.id, "song-1");
        assert_eq!(payload.update_id3, Some(true));
        assert!(payload.filename.is_some());
    }

    #[test]
    fn test_bulk_update_songs_payload() {
        let payload = BulkUpdateSongsPayload {
            ids: vec!["song-1".to_string(), "song-2".to_string()],
            updates: serde_json::json!({"album": "New Album"}),
            update_id3: Some(false),
        };

        assert_eq!(payload.ids.len(), 2);
        assert_eq!(payload.update_id3, Some(false));
    }

    #[test]
    fn test_add_marker_payload() {
        let payload = AddMarkerPayload {
            song_id: "song-1".to_string(),
            start: 30.5,
            end: Some(45.2),
            comment: Some("Chorus".to_string()),
            color: Some("#FF0000".to_string()),
        };

        assert_eq!(payload.start, 30.5);
        assert!(payload.end.is_some());
        assert!(payload.comment.is_some());
    }

    #[test]
    fn test_get_songs_query_with_filters() {
        let filters = serde_json::json!({
            "album": "Test Album",
            "year": 2023
        });

        let query = GetSongsQuery {
            filters: Some(filters),
            sort: Some("title".to_string()),
            limit: Some(10),
            offset: Some(0),
        };

        assert!(query.filters.is_some());
        assert_eq!(query.sort, Some("title".to_string()));
        assert_eq!(query.limit, Some(10));
    }

    #[test]
    fn test_get_playlists_query() {
        let query = GetPlaylistsQuery {
            filters: None,
            sort: Some("name".to_string()),
        };

        assert!(query.filters.is_none());
        assert_eq!(query.sort, Some("name".to_string()));
    }

    #[test]
    fn test_song_structure() {
        let song = Song {
            id: "test-id".to_string(),
            url: "/path/song.mp3".to_string(),
            filename: "song.mp3".to_string(),
            metadata: SongMetadata {
                title: "Title".to_string(),
                album: "Album".to_string(),
                year: Some(2023),
                track: Some(1),
                image: None,
                duration: 180.0,
                artists: vec!["Artist".to_string()],
                instruments: Some(vec!["Guitar".to_string()]),
                bpm: Some(120.0),
                genres: vec!["Rock".to_string()],
                comment: Some("Great".to_string()),
                tags: vec!["favorite".to_string()],
                file_exists: true,
                times_played: 5,
            },
            available: true,
        };

        assert_eq!(song.id, "test-id");
        assert_eq!(song.metadata.artists[0], "Artist");
        assert!(song.available);
    }

    #[test]
    fn test_playlist_structure() {
        let playlist = Playlist {
            id: "playlist-1".to_string(),
            name: "My Playlist".to_string(),
            tags: vec!["workout".to_string(), "chill".to_string()],
            total_duration: 3600.0,
        };

        assert_eq!(playlist.name, "My Playlist");
        assert_eq!(playlist.tags.len(), 2);
        assert_eq!(playlist.total_duration, 3600.0);
    }

    #[test]
    fn test_marker_structure() {
        let marker = Marker {
            id: "marker-1".to_string(),
            song: "song-1".to_string(),
            start: 10.0,
            end: Some(20.0),
            comment: Some("Intro".to_string()),
            color: Some("#00FF00".to_string()),
        };

        assert_eq!(marker.start, 10.0);
        assert_eq!(marker.end, Some(20.0));
        assert_eq!(marker.comment.as_ref().unwrap(), "Intro");
    }

    #[test]
    fn test_calculate_similarity_response() {
        let response = CalculateSimilarityResponse {
            similar: vec![],
            distances: vec![0.5, 0.7, 0.9],
        };

        assert_eq!(response.distances.len(), 3);
        assert_eq!(response.similar.len(), 0);
    }
}
