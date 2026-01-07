use sqlx::SqlitePool;
use crate::models::*;
use chrono::Utc;

pub struct Database {
    pool: SqlitePool,
}

impl Database {
    pub async fn new(database_url: &str) -> Result<Self, sqlx::Error> {
        let pool = SqlitePool::connect(database_url).await?;
        
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
        let total: i64 = sqlx::query_scalar(&count_sql)
            .fetch_one(&self.pool)
            .await?;

        // Get songs
        let db_songs: Vec<DbSong> = sqlx::query_as(&sql)
            .fetch_all(&self.pool)
            .await?;

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
        instruments: song.metadata.instruments
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
            "#
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

    pub async fn update_song(&self, id: &str, _updates: UpdateSongPayload) -> Result<Option<Song>, sqlx::Error> {
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

    pub async fn get_playlists(&self, query: GetPlaylistsQuery) -> Result<Vec<Playlist>, sqlx::Error> {
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

        let db_playlists: Vec<DbPlaylist> = sqlx::query_as(&sql)
            .fetch_all(&self.pool)
            .await?;

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
            "#
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
            "#
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