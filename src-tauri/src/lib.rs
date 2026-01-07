use std::sync::Arc;
use tokio::sync::Mutex;

mod models;
mod database;
mod commands;

use database::Database;

pub struct AppState {
    pub db: Arc<Mutex<Database>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() {
    // Initialize database
    let db = Database::new("sqlite:./nagan.db").await
        .expect("Failed to initialize database");

    let app_state = AppState {
        db: Arc::new(Mutex::new(db)),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::get_songs,
            commands::add_song,
            commands::update_song,
            commands::delete_song,
            commands::bulk_update_songs,
            commands::import_songs,
            commands::export_songs,
            commands::extract_metadata,
            commands::update_id3_tags,
            commands::rename_file,
            commands::get_playlists,
            commands::create_playlist,
            commands::update_playlist,
            commands::delete_playlist,
            commands::get_playlist_songs,
            commands::add_song_to_playlist,
            commands::remove_song_from_playlist,
            commands::reorder_playlist_songs,
            commands::shuffle_playlist,
            commands::get_random_next,
            commands::load_song,
            commands::get_markers,
            commands::add_marker,
            commands::update_marker,
            commands::remove_marker,
            commands::monitor_files,
            commands::search_songs,
            commands::calculate_similarity,
            commands::refresh_database,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
