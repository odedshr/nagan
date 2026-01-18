use serde_json;
use tauri::State;
use uuid::Uuid;

use crate::database::Database;
use crate::id3::Id3Manager;
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
    let db = state.db.lock().await;
    add_song_inner(&db, file_path, metadata).await
}

pub(crate) async fn add_song_inner(
    db: &Database,
    file_path: String,
    metadata: SongMetadata,
) -> Result<Song, String> {
    if db
        .get_song_by_url(&file_path)
        .await
        .map_err(|e| e.to_string())?
        .is_some()
    {
        return Err("Song with the same file_path already exists".to_string());
    }

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
    let db = state.db.lock().await;
    bulk_update_songs_inner(payload, &db).await
}

pub(crate) async fn bulk_update_songs_inner(
    payload: BulkUpdateSongsPayload,
    db: &Database,
) -> Result<i32, String> {
    let mut updated_count = 0;
    let id3_manager = Id3Manager::new();

    // First, get all songs to be updated
    let mut file_operations = Vec::new();

    for song_id in &payload.ids {
        if let Ok(Some(song)) = db.get_song_by_id(song_id).await {
            // Create updated metadata by merging current with updates
            let mut updated_metadata = song.metadata;

            if let Some(updates_obj) = payload.updates.as_object() {
                if let Some(title) = updates_obj.get("title").and_then(|v| v.as_str()) {
                    updated_metadata.title = title.to_string();
                }
                if let Some(album) = updates_obj.get("album").and_then(|v| v.as_str()) {
                    updated_metadata.album = album.to_string();
                }
                if let Some(year) = updates_obj.get("year").and_then(|v| v.as_i64()) {
                    updated_metadata.year = Some(year as i32);
                }
                if let Some(track) = updates_obj.get("track").and_then(|v| v.as_i64()) {
                    updated_metadata.track = Some(track as i32);
                }
                if let Some(bpm) = updates_obj.get("bpm").and_then(|v| v.as_f64()) {
                    updated_metadata.bpm = Some(bpm as f32);
                }
                if let Some(artists) = updates_obj.get("artists").and_then(|v| v.as_array()) {
                    updated_metadata.artists = artists
                        .iter()
                        .filter_map(|v| v.as_str())
                        .map(|s| s.to_string())
                        .collect();
                }
                if let Some(genres) = updates_obj.get("genres").and_then(|v| v.as_array()) {
                    updated_metadata.genres = genres
                        .iter()
                        .filter_map(|v| v.as_str())
                        .map(|s| s.to_string())
                        .collect();
                }
                if let Some(comment) = updates_obj.get("comment").and_then(|v| v.as_str()) {
                    updated_metadata.comment = Some(comment.to_string());
                }
            }

            // Add to file operations if ID3 update is requested
            if payload.update_id3.unwrap_or(false) {
                file_operations.push((song.url.clone(), updated_metadata.clone()));
            }

            // Update database
            let update_payload = UpdateSongPayload {
                id: song_id.clone(),
                metadata: serde_json::to_value(&updated_metadata).unwrap_or_default(),
                update_id3: payload.update_id3,
                filename: None,
            };

            if db.update_song(song_id, update_payload).await.is_ok() {
                updated_count += 1;
            }
        }
    }

    // Perform bulk ID3 updates if requested
    if !file_operations.is_empty() {
        if let Err(e) = id3_manager.bulk_write_metadata(file_operations) {
            log::error!("Bulk ID3 update failed: {}", e);
            // Note: We don't return error here since DB updates might have succeeded
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
pub async fn extract_metadata(file_path: String) -> Result<SongMetadata, String> {
    let id3_manager = Id3Manager::new();
    id3_manager
        .read_metadata(&file_path)
        .map_err(|e| format!("Failed to extract metadata: {}", e))
}

#[tauri::command]
pub async fn update_id3_tags(file_path: String, metadata: SongMetadata) -> Result<bool, String> {
    let id3_manager = Id3Manager::new();
    id3_manager
        .write_metadata(&file_path, &metadata)
        .map_err(|e| format!("Failed to update ID3 tags: {}", e))?;
    Ok(true)
}

#[tauri::command]
pub async fn bulk_update_id3_tags(
    operations: Vec<(String, SongMetadata)>,
) -> Result<Vec<(String, Result<(), String>)>, String> {
    let id3_manager = Id3Manager::new();

    let results = id3_manager
        .bulk_write_metadata(operations)
        .map_err(|e| format!("Bulk ID3 update failed: {}", e))?;

    let converted_results: Vec<(String, Result<(), String>)> = results
        .into_iter()
        .map(|(path, result)| {
            let converted_result = result.map_err(|e| e.to_string());
            (path, converted_result)
        })
        .collect();

    Ok(converted_results)
}

#[tauri::command]
pub async fn read_id3_tags(file_path: String) -> Result<SongMetadata, String> {
    let id3_manager = Id3Manager::new();
    id3_manager
        .read_metadata(&file_path)
        .map_err(|e| format!("Failed to read ID3 tags: {}", e))
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
pub async fn delete_playlist(
    id: String,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let db = state.db.lock().await;
    db.delete_playlist(&id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_playlist_songs(
    query: GetPlaylistSongsQuery,
    state: State<'_, AppState>,
) -> Result<Vec<Song>, String> {
    let db = state.db.lock().await;
    db.get_playlist_songs(&query.playlist_id, query.sort.as_deref())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_song_to_playlist(
    payload: AddSongToPlaylistPayload,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let db = state.db.lock().await;

    // Get the current max position in the playlist
    let max_position = db
        .get_max_playlist_position(&payload.playlist_id)
        .await
        .map_err(|e| e.to_string())?;

    // Calculate the actual position to insert at
    let actual_position = match payload.position {
        // If position is None, undefined, or negative, append to the end
        None => max_position + 1,
        Some(pos) if pos < 0 => max_position + 1,
        // If position is greater than max, append to the end
        Some(pos) if pos > max_position + 1 => max_position + 1,
        // Otherwise, use the specified position and shift existing items
        Some(pos) => {
            // Shift existing songs at and after this position
            db.shift_playlist_positions(&payload.playlist_id, pos)
                .await
                .map_err(|e| e.to_string())?;
            pos
        }
    };

    // Generate a new ID for the playlist_song entry
    let entry_id = Uuid::new_v4().to_string();

    db.add_song_to_playlist(&entry_id, &payload.playlist_id, &payload.song_id, actual_position)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn remove_song_from_playlist(
    payload: RemoveSongFromPlaylistPayload,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    // If both song_id and position are not provided, return false
    if payload.song_id.is_none() && payload.position.is_none() {
        return Ok(false);
    }

    let db = state.db.lock().await;

    // If song_id is provided, remove all instances of the song
    if let Some(song_id) = &payload.song_id {
        return db
            .remove_song_from_playlist_by_song_id(&payload.playlist_id, song_id)
            .await
            .map_err(|e| e.to_string());
    }

    // If position is provided, remove the song at that position
    if let Some(position) = payload.position {
        return db
            .remove_song_from_playlist_by_position(&payload.playlist_id, position)
            .await
            .map_err(|e| e.to_string());
    }

    Ok(false)
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
    async fn setup_test_db() -> Database {
        Database::new("sqlite::memory:")
            .await
            .expect("Failed to create test database")
    }

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

    #[tokio::test]
    async fn test_add_song_duplicate_file_path() {
        let db = setup_test_db().await;

        let metadata = SongMetadata {
            title: "Test Song".to_string(),
            album: "Test Album".to_string(),
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

        let file_path = "/music/test-song.mp3".to_string();

        let first = add_song_inner(&db, file_path.clone(), metadata.clone()).await;
        assert!(first.is_ok());

        let duplicate = add_song_inner(&db, file_path, metadata).await;
        assert!(duplicate.is_err());
    }
}
