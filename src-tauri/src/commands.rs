use tauri::State;
use uuid::Uuid;
use serde_json;

use crate::models::*;
use crate::database::Database;
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
    db.get_songs(query).await.map_err(|e: sqlx::Error| e.to_string())
}

#[tauri::command]
pub async fn add_song(
    file_path: String,
    state: State<'_, AppState>,
) -> Result<Song, String> {
    let song_id = Uuid::new_v4().to_string();
    let filename = std::path::Path::new(&file_path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    // Extract metadata (simplified version)
    let metadata = SongMetadata {
        title: filename.clone(),
        album: "Unknown Album".to_string(),
        year: None,
        track: None,
        image: None,
        duration: 0.0,
        artists: vec!["Unknown Artist".to_string()],
        instruments: None,
        bpm: None,
        genres: vec![],
        comment: None,
        tags: vec![],
        file_exists: true,
        times_played: 0,
    };

    let song = Song {
        id: song_id,
        url: file_path,
        filename,
        metadata,
        available: true,
    };

    let db = state.db.lock().await;
    db.create_song(song.clone()).await.map_err(|e| e.to_string())?;
    Ok(song)
}

#[tauri::command]
pub async fn update_song(
    payload: UpdateSongPayload,
    state: State<'_, AppState>,
) -> Result<Option<Song>, String> {
    let db = state.db.lock().await;
    db.update_song(&payload.id.clone(), payload).await.map_err(|e| e.to_string())
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
    db.create_playlist(playlist.clone()).await.map_err(|e| e.to_string())?;
    Ok(playlist)
}

// Playback Control Commands

#[tauri::command]
pub async fn load_song(
    song_id: String,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().await;
    let song = db.get_song_by_id(&song_id).await.map_err(|e| e.to_string())?;
    
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
    db.create_marker(marker.clone()).await.map_err(|e| e.to_string())?;
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