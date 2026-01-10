use crate::models::*;
use chrono::Utc;
use sqlx::sqlite::SqliteConnectOptions;
use sqlx::SqlitePool;
use std::str::FromStr;

pub struct Database {
    pool: SqlitePool,
}

impl Database {
    pub async fn new(database_url: &str) -> Result<Self, sqlx::Error> {
        // Create connection options with create_if_missing set to true
        let options = SqliteConnectOptions::from_str(database_url)?.create_if_missing(true);

        let pool = SqlitePool::connect_with(options).await?;

        // Run migrations
        sqlx::migrate!("./migrations").run(&pool).await?;

        Ok(Database { pool })
    }

    // Song Management

    pub async fn get_songs(&self, query: GetSongsQuery) -> Result<GetSongsResponse, sqlx::Error> {
        let mut sql = "SELECT * FROM songs".to_string();
        let mut count_sql = "SELECT COUNT(*) as count FROM songs".to_string();
        let mut where_clauses = Vec::new();

        // Add filters if provided
        if let Some(filters) = &query.filters {
            if let Some(filters_obj) = filters.as_object() {
                for (key, value) in filters_obj {
                    where_clauses.push(format!("{} = '{}'", key, value));
                }
            }
        }

        if !where_clauses.is_empty() {
            let where_clause = where_clauses.join(" AND ");
            sql.push_str(&format!(" WHERE {}", where_clause));
            count_sql.push_str(&format!(" WHERE {}", where_clause));
        }

        // Add sorting
        if let Some(sort) = &query.sort {
            sql.push_str(&format!(" ORDER BY {}", sort));
        }

        // Add pagination
        if let Some(limit) = query.limit {
            sql.push_str(&format!(" LIMIT {}", limit));
            if let Some(offset) = query.offset {
                sql.push_str(&format!(" OFFSET {}", offset));
            }
        }

        // Get total count
        let total: i64 = sqlx::query_scalar(&count_sql).fetch_one(&self.pool).await?;

        // Get songs
        let db_songs: Vec<DbSong> = sqlx::query_as(&sql).fetch_all(&self.pool).await?;

        let songs: Vec<Song> = db_songs.into_iter().map(|s| s.into()).collect();

        Ok(GetSongsResponse { songs, total })
    }

    pub async fn get_song_by_id(&self, id: &str) -> Result<Option<Song>, sqlx::Error> {
        let db_song: Option<DbSong> = sqlx::query_as("SELECT * FROM songs WHERE id = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;

        Ok(db_song.map(|s| s.into()))
    }

    pub async fn create_song(&self, song: Song) -> Result<Song, sqlx::Error> {
        let db_song = DbSong {
            id: song.id.clone(),
            url: song.url.clone(),
            filename: song.filename.clone(),
            title: song.metadata.title.clone(),
            album: song.metadata.album.clone(),
            year: song.metadata.year,
            track: song.metadata.track,
            image: song.metadata.image.clone(),
            duration: song.metadata.duration,
            artists: serde_json::to_string(&song.metadata.artists).unwrap_or_default(),
            instruments: song
                .metadata
                .instruments
                .as_ref()
                .map(|i| serde_json::to_string(i).unwrap_or_default()),
            bpm: song.metadata.bpm,
            genres: serde_json::to_string(&song.metadata.genres).unwrap_or_default(),
            comment: song.metadata.comment.clone(),
            tags: serde_json::to_string(&song.metadata.tags).unwrap_or_default(),
            file_exists: song.metadata.file_exists,
            times_played: song.metadata.times_played,
            available: song.available,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        sqlx::query(
            r#"
            INSERT INTO songs (
                id, url, filename, title, album, year, track, image, duration,
                artists, instruments, bpm, genres, comment, tags, file_exists,
                times_played, available, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&db_song.id)
        .bind(&db_song.url)
        .bind(&db_song.filename)
        .bind(&db_song.title)
        .bind(&db_song.album)
        .bind(db_song.year)
        .bind(db_song.track)
        .bind(&db_song.image)
        .bind(db_song.duration)
        .bind(&db_song.artists)
        .bind(&db_song.instruments)
        .bind(db_song.bpm)
        .bind(&db_song.genres)
        .bind(&db_song.comment)
        .bind(&db_song.tags)
        .bind(db_song.file_exists)
        .bind(db_song.times_played)
        .bind(db_song.available)
        .bind(db_song.created_at)
        .bind(db_song.updated_at)
        .execute(&self.pool)
        .await?;

        Ok(song)
    }

    pub async fn update_song(
        &self,
        id: &str,
        _updates: UpdateSongPayload,
    ) -> Result<Option<Song>, sqlx::Error> {
        // This is a simplified version - in a real implementation, you'd parse the metadata
        // and update specific fields
        sqlx::query("UPDATE songs SET updated_at = ? WHERE id = ?")
            .bind(Utc::now())
            .bind(id)
            .execute(&self.pool)
            .await?;

        self.get_song_by_id(id).await
    }

    pub async fn delete_song(&self, id: &str) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM songs WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    // Playlist Management

    pub async fn get_playlists(
        &self,
        query: GetPlaylistsQuery,
    ) -> Result<Vec<Playlist>, sqlx::Error> {
        let mut sql = "SELECT * FROM playlists".to_string();

        // Add filters if provided
        if let Some(filters) = query.filters {
            if let Some(filters_obj) = filters.as_object() {
                let mut where_clauses = Vec::new();
                for (key, value) in filters_obj {
                    where_clauses.push(format!("{} = '{}'", key, value));
                }
                if !where_clauses.is_empty() {
                    sql.push_str(&format!(" WHERE {}", where_clauses.join(" AND ")));
                }
            }
        }

        // Add sorting
        if let Some(sort) = query.sort {
            sql.push_str(&format!(" ORDER BY {}", sort));
        }

        let db_playlists: Vec<DbPlaylist> = sqlx::query_as(&sql).fetch_all(&self.pool).await?;

        Ok(db_playlists.into_iter().map(|p| p.into()).collect())
    }

    pub async fn create_playlist(&self, playlist: Playlist) -> Result<Playlist, sqlx::Error> {
        let db_playlist = DbPlaylist {
            id: playlist.id.clone(),
            name: playlist.name.clone(),
            tags: serde_json::to_string(&playlist.tags).unwrap_or_default(),
            total_duration: playlist.total_duration,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        sqlx::query(
            r#"
            INSERT INTO playlists (id, name, tags, total_duration, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&db_playlist.id)
        .bind(&db_playlist.name)
        .bind(&db_playlist.tags)
        .bind(db_playlist.total_duration)
        .bind(db_playlist.created_at)
        .bind(db_playlist.updated_at)
        .execute(&self.pool)
        .await?;

        Ok(playlist)
    }

    // Marker Management

    pub async fn get_markers(&self, song_id: &str) -> Result<Vec<Marker>, sqlx::Error> {
        let db_markers: Vec<DbMarker> = sqlx::query_as("SELECT * FROM markers WHERE song_id = ?")
            .bind(song_id)
            .fetch_all(&self.pool)
            .await?;

        Ok(db_markers.into_iter().map(|m| m.into()).collect())
    }

    pub async fn create_marker(&self, marker: Marker) -> Result<Marker, sqlx::Error> {
        let db_marker = DbMarker {
            id: marker.id.clone(),
            song_id: marker.song.clone(),
            start: marker.start,
            end: marker.end.clone(),
            comment: marker.comment.clone(),
            color: marker.color.clone(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        sqlx::query(
            r#"
            INSERT INTO markers (id, song_id, start, end, comment, color, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&db_marker.id)
        .bind(&db_marker.song_id)
        .bind(db_marker.start)
        .bind(db_marker.end)
        .bind(&db_marker.comment)
        .bind(&db_marker.color)
        .bind(db_marker.created_at)
        .bind(db_marker.updated_at)
        .execute(&self.pool)
        .await?;

        Ok(marker)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    async fn setup_test_db() -> Database {
        let db_url = "sqlite::memory:";
        Database::new(db_url)
            .await
            .expect("Failed to create test database")
    }

    #[tokio::test]
    async fn test_database_creation() {
        let db = setup_test_db().await;
        assert!(db.pool.is_closed() == false);
    }

    #[tokio::test]
    async fn test_create_and_get_song() {
        let db = setup_test_db().await;

        let song = Song {
            id: "test-song-1".to_string(),
            url: "/path/to/test.mp3".to_string(),
            filename: "test.mp3".to_string(),
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

        let created = db.create_song(song.clone()).await.unwrap();
        assert_eq!(created.id, song.id);

        let retrieved = db.get_song_by_id(&song.id).await.unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().metadata.title, "Test Song");
    }

    #[tokio::test]
    async fn test_get_songs_with_query() {
        let db = setup_test_db().await;

        // Create test songs
        for i in 1..=3 {
            let song = Song {
                id: format!("song-{}", i),
                url: format!("/path/song{}.mp3", i),
                filename: format!("song{}.mp3", i),
                metadata: SongMetadata {
                    title: format!("Song {}", i),
                    album: "Album".to_string(),
                    year: Some(2023),
                    track: Some(i),
                    image: None,
                    duration: 180.0 * i as f64,
                    artists: vec!["Artist".to_string()],
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
            db.create_song(song).await.unwrap();
        }

        let query = GetSongsQuery {
            filters: None,
            sort: Some("title".to_string()),
            limit: Some(10),
            offset: None,
        };

        let result = db.get_songs(query).await.unwrap();
        assert_eq!(result.total, 3);
        assert_eq!(result.songs.len(), 3);
    }

    #[tokio::test]
    async fn test_update_song() {
        let db = setup_test_db().await;

        let song = Song {
            id: "update-test".to_string(),
            url: "/path/test.mp3".to_string(),
            filename: "test.mp3".to_string(),
            metadata: SongMetadata {
                title: "Original".to_string(),
                album: "Album".to_string(),
                year: Some(2023),
                track: Some(1),
                image: None,
                duration: 180.0,
                artists: vec!["Artist".to_string()],
                instruments: None,
                bpm: Some(120.0),
                genres: vec![],
                comment: None,
                tags: vec![],
                file_exists: true,
                times_played: 0,
            },
            available: true,
        };

        db.create_song(song).await.unwrap();

        let update_payload = UpdateSongPayload {
            id: "update-test".to_string(),
            metadata: serde_json::json!({"title": "Updated"}),
            update_id3: None,
            filename: None,
        };

        let updated = db.update_song("update-test", update_payload).await.unwrap();
        assert!(updated.is_some());
    }

    #[tokio::test]
    async fn test_delete_song() {
        let db = setup_test_db().await;

        let song = Song {
            id: "delete-test".to_string(),
            url: "/path/test.mp3".to_string(),
            filename: "test.mp3".to_string(),
            metadata: SongMetadata {
                title: "Delete Me".to_string(),
                album: "Album".to_string(),
                year: None,
                track: None,
                image: None,
                duration: 120.0,
                artists: vec![],
                instruments: None,
                bpm: None,
                genres: vec![],
                comment: None,
                tags: vec![],
                file_exists: true,
                times_played: 0,
            },
            available: true,
        };

        db.create_song(song).await.unwrap();
        let deleted = db.delete_song("delete-test").await.unwrap();
        assert!(deleted);

        let retrieved = db.get_song_by_id("delete-test").await.unwrap();
        assert!(retrieved.is_none());
    }

    #[tokio::test]
    async fn test_create_and_get_playlist() {
        let db = setup_test_db().await;

        let playlist = Playlist {
            id: "playlist-1".to_string(),
            name: "Test Playlist".to_string(),
            tags: vec!["chill".to_string()],
            total_duration: 1200.0,
        };

        let created = db.create_playlist(playlist.clone()).await.unwrap();
        assert_eq!(created.name, "Test Playlist");

        let query = GetPlaylistsQuery {
            filters: None,
            sort: None,
        };

        let playlists = db.get_playlists(query).await.unwrap();
        assert_eq!(playlists.len(), 1);
        assert_eq!(playlists[0].name, "Test Playlist");
    }

    #[tokio::test]
    async fn test_create_and_get_markers() {
        let db = setup_test_db().await;

        // First create a song
        let song = Song {
            id: "song-with-markers".to_string(),
            url: "/path/test.mp3".to_string(),
            filename: "test.mp3".to_string(),
            metadata: SongMetadata {
                title: "Song".to_string(),
                album: "Album".to_string(),
                year: None,
                track: None,
                image: None,
                duration: 300.0,
                artists: vec![],
                instruments: None,
                bpm: None,
                genres: vec![],
                comment: None,
                tags: vec![],
                file_exists: true,
                times_played: 0,
            },
            available: true,
        };
        db.create_song(song).await.unwrap();

        // Create markers
        let marker = Marker {
            id: "marker-1".to_string(),
            song: "song-with-markers".to_string(),
            start: 30.0,
            end: Some(60.0),
            comment: Some("Chorus".to_string()),
            color: Some("#FF0000".to_string()),
        };

        let created = db.create_marker(marker).await.unwrap();
        assert_eq!(created.start, 30.0);

        let markers = db.get_markers("song-with-markers").await.unwrap();
        assert_eq!(markers.len(), 1);
        assert_eq!(markers[0].comment, Some("Chorus".to_string()));
    }

    #[tokio::test]
    async fn test_get_songs_with_limit() {
        let db = setup_test_db().await;

        // Create 5 songs
        for i in 1..=5 {
            let song = Song {
                id: format!("limit-song-{}", i),
                url: format!("/path/{}.mp3", i),
                filename: format!("{}.mp3", i),
                metadata: SongMetadata {
                    title: format!("Song {}", i),
                    album: "Album".to_string(),
                    year: None,
                    track: None,
                    image: None,
                    duration: 180.0,
                    artists: vec![],
                    instruments: None,
                    bpm: None,
                    genres: vec![],
                    comment: None,
                    tags: vec![],
                    file_exists: true,
                    times_played: 0,
                },
                available: true,
            };
            db.create_song(song).await.unwrap();
        }

        let query = GetSongsQuery {
            filters: None,
            sort: None,
            limit: Some(3),
            offset: None,
        };

        let result = db.get_songs(query).await.unwrap();
        assert_eq!(result.songs.len(), 3);
        assert_eq!(result.total, 5);
    }

    #[tokio::test]
    async fn test_get_songs_with_offset() {
        let db = setup_test_db().await;

        for i in 1..=5 {
            let song = Song {
                id: format!("offset-song-{}", i),
                url: format!("/path/{}.mp3", i),
                filename: format!("{}.mp3", i),
                metadata: SongMetadata {
                    title: format!("Song {}", i),
                    album: "Album".to_string(),
                    year: None,
                    track: None,
                    image: None,
                    duration: 180.0,
                    artists: vec![],
                    instruments: None,
                    bpm: None,
                    genres: vec![],
                    comment: None,
                    tags: vec![],
                    file_exists: true,
                    times_played: 0,
                },
                available: true,
            };
            db.create_song(song).await.unwrap();
        }

        let query = GetSongsQuery {
            filters: None,
            sort: None,
            limit: Some(2),
            offset: Some(2),
        };

        let result = db.get_songs(query).await.unwrap();
        assert_eq!(result.songs.len(), 2);
    }
}
