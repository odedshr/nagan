use crate::models::*;
use chrono::Utc;
use sqlx::sqlite::SqliteConnectOptions;
use sqlx::Row;
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
                    where_clauses.push(format!("{} = {}", key, value));
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

    pub async fn get_song_groups(
        &self,
        query: GetSongsGroupsQuery,
    ) -> Result<GetSongsGroupsResponse, sqlx::Error> {
        #[derive(Debug, Clone)]
        enum BindValue {
            Text(String),
            Int(i64),
            Float(f64),
        }

        fn normalize_group_name(name: &str) -> Option<&'static str> {
            match name {
                "artist" | "artists" => Some("artist"),
                "album" | "albums" => Some("album"),
                "year" | "years" => Some("year"),
                "bpm" => Some("bpm"),
                "genre" | "genres" => Some("genre"),
                _ => None,
            }
        }

        fn bpm_bucket_case_expr() -> &'static str {
            "CASE\n                WHEN bpm IS NULL THEN 'Unknown'\n                WHEN bpm < 60 THEN '<60'\n                WHEN bpm < 80 THEN '60-79'\n                WHEN bpm < 100 THEN '80-99'\n                WHEN bpm < 120 THEN '100-119'\n                WHEN bpm < 130 THEN '120-129'\n                WHEN bpm < 140 THEN '130-139'\n                ELSE '140+'\n            END"
        }

        fn bpm_bucket_for_value(bpm: f64) -> &'static str {
            if bpm < 60.0 {
                "<60"
            } else if bpm < 80.0 {
                "60-79"
            } else if bpm < 100.0 {
                "80-99"
            } else if bpm < 120.0 {
                "100-119"
            } else if bpm < 130.0 {
                "120-129"
            } else if bpm < 140.0 {
                "130-139"
            } else {
                "140+"
            }
        }

        fn add_selection_filter(
            where_clauses: &mut Vec<String>,
            binds: &mut Vec<BindValue>,
            group_name: &str,
            selected_value: &serde_json::Value,
        ) {
            let Some(group_name) = normalize_group_name(group_name) else {
                return;
            };

            match group_name {
                "album" => {
                    if selected_value.is_null() {
                        where_clauses.push("album IS NULL".to_string());
                    } else if let Some(s) = selected_value.as_str() {
                        where_clauses.push("album = ?".to_string());
                        binds.push(BindValue::Text(s.to_string()));
                    }
                }
                "year" => {
                    if selected_value.is_null() {
                        where_clauses.push("year IS NULL".to_string());
                    } else if let Some(n) = selected_value.as_i64() {
                        where_clauses.push("year = ?".to_string());
                        binds.push(BindValue::Int(n));
                    } else if let Some(s) = selected_value.as_str() {
                        if let Ok(n) = s.parse::<i64>() {
                            where_clauses.push("year = ?".to_string());
                            binds.push(BindValue::Int(n));
                        }
                    }
                }
                "artist" => {
                    if let Some(s) = selected_value.as_str() {
                        where_clauses.push(
                            "EXISTS (SELECT 1 FROM json_each(songs.artists) WHERE value = ?)"
                                .to_string(),
                        );
                        binds.push(BindValue::Text(s.to_string()));
                    }
                }
                "genre" => {
                    if let Some(s) = selected_value.as_str() {
                        where_clauses.push(
                            "EXISTS (SELECT 1 FROM json_each(songs.genres) WHERE value = ?)"
                                .to_string(),
                        );
                        binds.push(BindValue::Text(s.to_string()));
                    }
                }
                "bpm" => {
                    if selected_value.is_null() {
                        where_clauses.push("bpm IS NULL".to_string());
                        return;
                    }

                    let bucket: Option<String> = if let Some(s) = selected_value.as_str() {
                        Some(s.to_string())
                    } else if let Some(n) = selected_value.as_f64() {
                        Some(bpm_bucket_for_value(n).to_string())
                    } else {
                        None
                    };

                    let Some(bucket) = bucket else {
                        return;
                    };

                    match bucket.as_str() {
                        "Unknown" => where_clauses.push("bpm IS NULL".to_string()),
                        "<60" => {
                            where_clauses.push("bpm IS NOT NULL AND bpm < ?".to_string());
                            binds.push(BindValue::Float(60.0));
                        }
                        "60-79" => {
                            where_clauses
                                .push("bpm IS NOT NULL AND bpm >= ? AND bpm < ?".to_string());
                            binds.push(BindValue::Float(60.0));
                            binds.push(BindValue::Float(80.0));
                        }
                        "80-99" => {
                            where_clauses
                                .push("bpm IS NOT NULL AND bpm >= ? AND bpm < ?".to_string());
                            binds.push(BindValue::Float(80.0));
                            binds.push(BindValue::Float(100.0));
                        }
                        "100-119" => {
                            where_clauses
                                .push("bpm IS NOT NULL AND bpm >= ? AND bpm < ?".to_string());
                            binds.push(BindValue::Float(100.0));
                            binds.push(BindValue::Float(120.0));
                        }
                        "120-129" => {
                            where_clauses
                                .push("bpm IS NOT NULL AND bpm >= ? AND bpm < ?".to_string());
                            binds.push(BindValue::Float(120.0));
                            binds.push(BindValue::Float(130.0));
                        }
                        "130-139" => {
                            where_clauses
                                .push("bpm IS NOT NULL AND bpm >= ? AND bpm < ?".to_string());
                            binds.push(BindValue::Float(130.0));
                            binds.push(BindValue::Float(140.0));
                        }
                        "140+" => {
                            where_clauses.push("bpm IS NOT NULL AND bpm >= ?".to_string());
                            binds.push(BindValue::Float(140.0));
                        }
                        _ => {}
                    }
                }
                _ => {}
            }
        }

        async fn run_group_items_query(
            pool: &SqlitePool,
            sql: String,
            binds: Vec<BindValue>,
        ) -> Result<Vec<SongGroupItemCount>, sqlx::Error> {
            let mut q = sqlx::query(&sql);
            for bind in binds {
                q = match bind {
                    BindValue::Text(s) => q.bind(s),
                    BindValue::Int(i) => q.bind(i),
                    BindValue::Float(f) => q.bind(f),
                };
            }

            let rows = q.fetch_all(pool).await?;
            let mut out = Vec::with_capacity(rows.len());
            for row in rows {
                let name: String = row.try_get("name")?;
                let count: i64 = row.try_get("count")?;
                out.push(SongGroupItemCount { name, count });
            }
            Ok(out)
        }

        let mut out_groups: Vec<SongGroupResponseItem> = Vec::new();

        for (idx, group) in query.groups.iter().enumerate() {
            let group_name = normalize_group_name(&group.name).unwrap_or(&group.name);

            let mut where_clauses: Vec<String> = Vec::new();
            let mut binds: Vec<BindValue> = Vec::new();

            // Apply filters from all preceding groups that have a selection.
            for prev in query.groups.iter().take(idx) {
                add_selection_filter(&mut where_clauses, &mut binds, &prev.name, &prev.selected);
            }

            let order_by = match group.sort_by {
                SongGroupSortBy::ValueAsec => "name ASC",
                SongGroupSortBy::ValueDesc => "name DESC",
                SongGroupSortBy::CountAsec => "count ASC, name ASC",
                SongGroupSortBy::CountDesc => "count DESC, name ASC",
            };
            let mut sql = match normalize_group_name(group_name) {
                Some("album") => {
                    "SELECT album as name, COUNT(*) as count FROM songs".to_string()
                }
                Some("year") => {
                    "SELECT COALESCE(CAST(year AS TEXT), 'Unknown') as name, COUNT(*) as count FROM songs".to_string()
                }
                Some("bpm") => {
                    format!(
                        "SELECT {} as name, COUNT(*) as count FROM songs",
                        bpm_bucket_case_expr()
                    )
                }
                Some("artist") => {
                    "SELECT je.value as name, COUNT(DISTINCT songs.id) as count FROM songs JOIN json_each(songs.artists) as je".to_string()
                }
                Some("genre") => {
                    "SELECT je.value as name, COUNT(DISTINCT songs.id) as count FROM songs JOIN json_each(songs.genres) as je".to_string()
                }
                _ => {
                    // Unknown group name - return empty group items (validation is expected in command layer)
                    out_groups.push(SongGroupResponseItem {
                        name: group.name.clone(),
                        selected: group.selected.clone(),
                        sort_by: group.sort_by.clone(),
                        items: vec![],
                    });
                    continue;
                }
            };

            if matches!(normalize_group_name(group_name), Some("artist") | Some("genre")) {
                where_clauses.push("je.value IS NOT NULL AND je.value != ''".to_string());
            }

            if !where_clauses.is_empty() {
                sql.push_str(" WHERE ");
                sql.push_str(&where_clauses.join(" AND "));
            }

            sql.push_str(&format!(" GROUP BY name ORDER BY {}", order_by));

            let items = run_group_items_query(&self.pool, sql, binds).await?;
            out_groups.push(SongGroupResponseItem {
                name: group.name.clone(),
                selected: group.selected.clone(),
                sort_by: group.sort_by.clone(),
                items,
            });
        }

        Ok(GetSongsGroupsResponse { groups: out_groups })
    }

    pub async fn get_song_by_id(&self, id: &str) -> Result<Option<Song>, sqlx::Error> {
        let db_song: Option<DbSong> = sqlx::query_as("SELECT * FROM songs WHERE id = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;

        Ok(db_song.map(|s| s.into()))
    }

    pub async fn get_song_by_url(&self, url: &str) -> Result<Option<Song>, sqlx::Error> {
        let db_song: Option<DbSong> = sqlx::query_as("SELECT * FROM songs WHERE url = ?")
            .bind(url)
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
        updates: UpdateSongPayload,
    ) -> Result<Option<Song>, sqlx::Error> {
        // Fast existence check so we can return Ok(None) for unknown ids
        if self.get_song_by_id(id).await?.is_none() {
            return Ok(None);
        }

        let mut new_title: Option<String> = None;
        let mut new_album: Option<String> = None;
        let mut new_artists_json: Option<String> = None;
        let mut new_year: Option<i32> = None;
        let mut new_bpm: Option<f32> = None;
        let mut new_genres_json: Option<String> = None;
        let mut new_comment: Option<String> = None;

        if let Some(obj) = updates.metadata.as_object() {
            if let Some(title) = obj.get("title").and_then(|v| v.as_str()) {
                new_title = Some(title.to_string());
            }
            if let Some(album) = obj.get("album").and_then(|v| v.as_str()) {
                new_album = Some(album.to_string());
            }

            if let Some(year) = obj.get("year").and_then(|v| v.as_i64()) {
                if let Ok(year) = i32::try_from(year) {
                    new_year = Some(year);
                }
            }

            if let Some(bpm) = obj.get("bpm").and_then(|v| v.as_f64()) {
                if bpm.is_finite() {
                    new_bpm = Some(bpm as f32);
                }
            }

            // Preferred: { artists: ["a", "b"] }
            if let Some(artists) = obj.get("artists").and_then(|v| v.as_array()) {
                let artists_vec: Vec<String> = artists
                    .iter()
                    .filter_map(|v| v.as_str())
                    .map(|s| s.to_string())
                    .collect();
                new_artists_json = Some(serde_json::to_string(&artists_vec).unwrap_or("[]".into()));
            } else if let Some(artist) = obj.get("artist").and_then(|v| v.as_str()) {
                // Fallback: { artist: "single" }
                new_artists_json =
                    Some(serde_json::to_string(&vec![artist.to_string()]).unwrap_or("[]".into()));
            }

            // Preferred: { genres: ["a", "b"] }, but also accept { genre: "single" }
            if let Some(genres) = obj.get("genres") {
                if let Some(arr) = genres.as_array() {
                    let genres_vec: Vec<String> = arr
                        .iter()
                        .filter_map(|v| v.as_str())
                        .map(|s| s.to_string())
                        .collect();
                    new_genres_json =
                        Some(serde_json::to_string(&genres_vec).unwrap_or("[]".into()));
                } else if let Some(genre) = genres.as_str() {
                    new_genres_json =
                        Some(serde_json::to_string(&vec![genre.to_string()]).unwrap_or("[]".into()));
                }
            } else if let Some(genre) = obj.get("genre") {
                if let Some(arr) = genre.as_array() {
                    let genres_vec: Vec<String> = arr
                        .iter()
                        .filter_map(|v| v.as_str())
                        .map(|s| s.to_string())
                        .collect();
                    new_genres_json =
                        Some(serde_json::to_string(&genres_vec).unwrap_or("[]".into()));
                } else if let Some(genre) = genre.as_str() {
                    new_genres_json =
                        Some(serde_json::to_string(&vec![genre.to_string()]).unwrap_or("[]".into()));
                }
            }

            if let Some(comment) = obj.get("comment").and_then(|v| v.as_str()) {
                new_comment = Some(comment.to_string());
            }
        }

        sqlx::query(
            r#"
            UPDATE songs
            SET
              title = COALESCE(?, title),
              album = COALESCE(?, album),
              artists = COALESCE(?, artists),
                            year = COALESCE(?, year),
                            bpm = COALESCE(?, bpm),
                            genres = COALESCE(?, genres),
                            comment = COALESCE(?, comment),
              filename = COALESCE(?, filename),
              updated_at = ?
            WHERE id = ?
            "#,
        )
        .bind(new_title)
        .bind(new_album)
        .bind(new_artists_json)
                .bind(new_year)
                .bind(new_bpm)
                .bind(new_genres_json)
                .bind(new_comment)
        .bind(updates.filename)
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

    pub async fn delete_playlist(&self, id: &str) -> Result<bool, sqlx::Error> {
        // First, delete all playlist_songs entries for this playlist
        sqlx::query("DELETE FROM playlist_songs WHERE playlist_id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        // Then delete the playlist itself
        let result = sqlx::query("DELETE FROM playlists WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn get_max_playlist_position(&self, playlist_id: &str) -> Result<i32, sqlx::Error> {
        let result: Option<(i32,)> = sqlx::query_as(
            "SELECT COALESCE(MAX(position), -1) FROM playlist_songs WHERE playlist_id = ?"
        )
        .bind(playlist_id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(result.map(|(pos,)| pos).unwrap_or(-1))
    }

    pub async fn shift_playlist_positions(
        &self,
        playlist_id: &str,
        from_position: i32,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            "UPDATE playlist_songs SET position = position + 1 WHERE playlist_id = ? AND position >= ?"
        )
        .bind(playlist_id)
        .bind(from_position)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn add_song_to_playlist(
        &self,
        id: &str,
        playlist_id: &str,
        song_id: &str,
        position: i32,
    ) -> Result<bool, sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO playlist_songs (id, playlist_id, song_id, position, added_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            "#,
        )
        .bind(id)
        .bind(playlist_id)
        .bind(song_id)
        .bind(position)
        .execute(&self.pool)
        .await?;

        Ok(true)
    }

    pub async fn get_playlist_songs(
        &self,
        playlist_id: &str,
        sort: Option<&str>,
    ) -> Result<Vec<Song>, sqlx::Error> {
        let mut sql = r#"
            SELECT s.* FROM songs s
            INNER JOIN playlist_songs ps ON s.id = ps.song_id
            WHERE ps.playlist_id = ?
        "#.to_string();

        // Add sorting - default to position order
        if let Some(sort_field) = sort {
            sql.push_str(&format!(" ORDER BY s.{}", sort_field));
        } else {
            sql.push_str(" ORDER BY ps.position");
        }

        let db_songs: Vec<DbSong> = sqlx::query_as(&sql)
            .bind(playlist_id)
            .fetch_all(&self.pool)
            .await?;

        Ok(db_songs.into_iter().map(|s| s.into()).collect())
    }

    pub async fn remove_song_from_playlist_by_song_id(
        &self,
        playlist_id: &str,
        song_id: &str,
    ) -> Result<bool, sqlx::Error> {
        // Get all positions of the song being removed (in descending order to avoid shifting issues)
        let positions: Vec<(i32,)> = sqlx::query_as(
            "SELECT position FROM playlist_songs WHERE playlist_id = ? AND song_id = ? ORDER BY position DESC"
        )
        .bind(playlist_id)
        .bind(song_id)
        .fetch_all(&self.pool)
        .await?;

        if positions.is_empty() {
            return Ok(false);
        }

        // Delete all instances of the song from the playlist
        sqlx::query(
            "DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?"
        )
        .bind(playlist_id)
        .bind(song_id)
        .execute(&self.pool)
        .await?;

        // Shift positions for each removed song (process from highest to lowest position)
        for (removed_position,) in positions {
            sqlx::query(
                "UPDATE playlist_songs SET position = position - 1 WHERE playlist_id = ? AND position > ?"
            )
            .bind(playlist_id)
            .bind(removed_position)
            .execute(&self.pool)
            .await?;
        }

        Ok(true)
    }

    pub async fn remove_song_from_playlist_by_position(
        &self,
        playlist_id: &str,
        position: i32,
    ) -> Result<bool, sqlx::Error> {
        // Delete the song at the specified position
        let result = sqlx::query(
            "DELETE FROM playlist_songs WHERE playlist_id = ? AND position = ?"
        )
        .bind(playlist_id)
        .bind(position)
        .execute(&self.pool)
        .await?;

        if result.rows_affected() == 0 {
            return Ok(false);
        }

        // Shift positions of songs after the removed position
        sqlx::query(
            "UPDATE playlist_songs SET position = position - 1 WHERE playlist_id = ? AND position > ?"
        )
        .bind(playlist_id)
        .bind(position)
        .execute(&self.pool)
        .await?;

        Ok(true)
    }

    pub async fn reorder_playlist_songs(
        &self,
        playlist_id: &str,
        song_ids: &[String],
    ) -> Result<bool, sqlx::Error> {
        // First, set all positions to negative temporary values to avoid UNIQUE constraint conflicts
        for (index, song_id) in song_ids.iter().enumerate() {
            let temp_position = -(index as i32) - 1; // -1, -2, -3, etc.
            sqlx::query(
                "UPDATE playlist_songs SET position = ? WHERE playlist_id = ? AND song_id = ?"
            )
            .bind(temp_position)
            .bind(playlist_id)
            .bind(song_id)
            .execute(&self.pool)
            .await?;
        }

        // Then, set the actual new positions
        for (index, song_id) in song_ids.iter().enumerate() {
            let position = index as i32;
            sqlx::query(
                "UPDATE playlist_songs SET position = ? WHERE playlist_id = ? AND song_id = ?"
            )
            .bind(position)
            .bind(playlist_id)
            .bind(song_id)
            .execute(&self.pool)
            .await?;
        }

        Ok(true)
    }

    pub async fn shuffle_playlist_songs(
        &self,
        playlist_id: &str,
    ) -> Result<Vec<String>, sqlx::Error> {
        use rand::seq::SliceRandom;

        // Get all song IDs in the playlist ordered by position
        let song_ids: Vec<(String,)> = sqlx::query_as(
            "SELECT song_id FROM playlist_songs WHERE playlist_id = ? ORDER BY position"
        )
        .bind(playlist_id)
        .fetch_all(&self.pool)
        .await?;

        let mut song_ids: Vec<String> = song_ids.into_iter().map(|(id,)| id).collect();

        if song_ids.is_empty() {
            return Ok(song_ids);
        }

        // Shuffle the song IDs using a thread-safe RNG
        song_ids.shuffle(&mut rand::rng());

        // Reorder using the existing method
        self.reorder_playlist_songs(playlist_id, &song_ids).await?;

        Ok(song_ids)
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
    async fn test_get_song_by_url_found() {
        let db = setup_test_db().await;

        let song = Song {
            id: "test-song-url".to_string(),
            url: "/path/to/test-url.mp3".to_string(),
            filename: "test-url.mp3".to_string(),
            metadata: SongMetadata {
                title: "URL Song".to_string(),
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

        db.create_song(song.clone()).await.unwrap();

        let retrieved = db.get_song_by_url(&song.url).await.unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().id, song.id);
    }

    #[tokio::test]
    async fn test_get_song_by_url_not_found() {
        let db = setup_test_db().await;

        let retrieved = db.get_song_by_url("/path/to/missing.mp3").await.unwrap();
        assert!(retrieved.is_none());
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
            metadata: serde_json::json!({
                "title": "Updated",
                "year": 2024,
                "bpm": 128.5,
                "genre": "Rock",
                "comment": "hello"
            }),
            update_id3: None,
            filename: None,
        };

        let updated = db.update_song("update-test", update_payload).await.unwrap();
        assert!(updated.is_some());

        let updated = updated.unwrap();
        assert_eq!(updated.metadata.title, "Updated");
        assert_eq!(updated.metadata.year, Some(2024));
        assert_eq!(updated.metadata.genres, vec!["Rock".to_string()]);
        assert_eq!(updated.metadata.comment, Some("hello".to_string()));
        assert!(updated
            .metadata
            .bpm
            .map(|b| (b - 128.5).abs() < 0.0001)
            .unwrap_or(false));
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

    #[tokio::test]
    async fn test_get_song_groups_genre_then_year() {
        let db = setup_test_db().await;

        let songs = vec![
            Song {
                id: "g1".to_string(),
                url: "/path/g1.mp3".to_string(),
                filename: "g1.mp3".to_string(),
                metadata: SongMetadata {
                    title: "G1".to_string(),
                    album: "A".to_string(),
                    year: Some(2020),
                    track: None,
                    image: None,
                    duration: 1.0,
                    artists: vec!["Artist1".to_string()],
                    instruments: None,
                    bpm: Some(128.0),
                    genres: vec!["Rock".to_string(), "Pop".to_string()],
                    comment: None,
                    tags: vec![],
                    file_exists: true,
                    times_played: 0,
                },
                available: true,
            },
            Song {
                id: "g2".to_string(),
                url: "/path/g2.mp3".to_string(),
                filename: "g2.mp3".to_string(),
                metadata: SongMetadata {
                    title: "G2".to_string(),
                    album: "A".to_string(),
                    year: Some(2021),
                    track: None,
                    image: None,
                    duration: 1.0,
                    artists: vec!["Artist2".to_string()],
                    instruments: None,
                    bpm: Some(95.0),
                    genres: vec!["Rock".to_string()],
                    comment: None,
                    tags: vec![],
                    file_exists: true,
                    times_played: 0,
                },
                available: true,
            },
            Song {
                id: "g3".to_string(),
                url: "/path/g3.mp3".to_string(),
                filename: "g3.mp3".to_string(),
                metadata: SongMetadata {
                    title: "G3".to_string(),
                    album: "B".to_string(),
                    year: Some(2021),
                    track: None,
                    image: None,
                    duration: 1.0,
                    artists: vec!["Artist2".to_string(), "Artist3".to_string()],
                    instruments: None,
                    bpm: None,
                    genres: vec!["Jazz".to_string()],
                    comment: None,
                    tags: vec![],
                    file_exists: true,
                    times_played: 0,
                },
                available: true,
            },
        ];

        for song in songs {
            db.create_song(song).await.unwrap();
        }

        let result = db
            .get_song_groups(GetSongsGroupsQuery {
                groups: vec![
                    SongGroupRequestItem {
                        name: "genre".to_string(),
                        selected: serde_json::json!("Rock"),
                        sort_by: SongGroupSortBy::ValueAsec,
                    },
                    SongGroupRequestItem {
                        name: "year".to_string(),
                        selected: serde_json::Value::Null,
                        sort_by: SongGroupSortBy::ValueAsec,
                    },
                ],
            })
            .await
            .unwrap();

        assert_eq!(result.groups.len(), 2);

        // Group 0: genre counts across all songs
        let genre_group = &result.groups[0];
        let mut genre_counts: std::collections::HashMap<String, i64> = std::collections::HashMap::new();
        for item in &genre_group.items {
            genre_counts.insert(item.name.clone(), item.count);
        }
        assert_eq!(genre_counts.get("Rock"), Some(&2));
        assert_eq!(genre_counts.get("Pop"), Some(&1));
        assert_eq!(genre_counts.get("Jazz"), Some(&1));

        // Group 1: year counts restricted to selected genre=Rock
        let year_group = &result.groups[1];
        let mut year_counts: std::collections::HashMap<String, i64> = std::collections::HashMap::new();
        for item in &year_group.items {
            year_counts.insert(item.name.clone(), item.count);
        }
        assert_eq!(year_counts.get("2020"), Some(&1));
        assert_eq!(year_counts.get("2021"), Some(&1));
    }
}
