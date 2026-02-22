use std::sync::Arc;
use tokio::sync::Mutex;

mod commands;
mod bpm;
mod database;
mod id3;
mod models;

use database::Database;

pub struct AppState {
    pub db: Arc<Mutex<Database>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() {
    // Get the app data directory
    let app_dir = dirs::data_local_dir()
        .expect("Failed to get app data directory")
        .join("nagan");

    // Create the directory if it doesn't exist
    std::fs::create_dir_all(&app_dir).expect("Failed to create app directory");

    let db_path = app_dir.join("nagan.db");
    let db_url = format!("sqlite:///{}", db_path.display());

    println!("Database path: {}", db_url);

    // Initialize database
    let db = Database::new(&db_url)
        .await
        .expect("Failed to initialize database");

    let app_state = AppState {
        db: Arc::new(Mutex::new(db)),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            commands::get_songs,
            commands::get_song_groups,
            commands::add_song,
            commands::update_song,
            commands::delete_song,
            commands::get_song_bpm,
            commands::bulk_update_songs,
            commands::import_songs,
            commands::export_songs,
            commands::extract_metadata,
            commands::update_id3_tags,
            commands::bulk_update_id3_tags,
            commands::read_id3_tags,
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
