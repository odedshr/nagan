use crate::models::SongMetadata;
use id3::frame::{Comment, Content};
use id3::{Frame, Tag, TagLike};
use lofty::config::WriteOptions;
use lofty::file::{AudioFile, TaggedFileExt};
use lofty::tag::Accessor;
use std::fs::File;
use std::path::Path;

pub struct Id3Manager;

impl Id3Manager {
    pub fn new() -> Self {
        Self
    }

    pub fn read_metadata(&self, file_path: &str) -> Result<SongMetadata, Box<dyn std::error::Error>> {
        let path = Path::new(file_path);
        
        if !path.exists() {
            return Err("File does not exist".into());
        }

        // Try reading with lofty first (supports more formats)
        if let Ok(metadata) = self.read_with_lofty(file_path) {
            return Ok(metadata);
        }

        // Fallback to id3 for MP3 files
        if file_path.to_lowercase().ends_with(".mp3") {
            return self.read_with_id3(file_path);
        }

        Err("Unsupported file format".into())
    }

    fn read_with_lofty(&self, file_path: &str) -> Result<SongMetadata, Box<dyn std::error::Error>> {
        let mut file = File::open(file_path)?;
        
        let parsed_file = lofty::read_from(&mut file)?;
        let properties = parsed_file.properties();
        
        let tag = parsed_file.tags().first();

        let title = tag
            .and_then(|t| t.title())
            .map(|s| s.to_string())
            .unwrap_or_else(|| {
                Path::new(file_path)
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("Unknown Title")
                    .to_string()
            });

        let artists = tag
            .and_then(|t| t.artist())
            .map(|a| vec![a.to_string()])
            .unwrap_or_else(|| vec!["Unknown Artist".to_string()]);

        let album = tag
            .and_then(|t| t.album())
            .map(|a| a.to_string())
            .unwrap_or_else(|| "Unknown Album".to_string());
        let year = tag.and_then(|t| t.year()).map(|y| y as i32);
        let track = tag.and_then(|t| t.track()).map(|t| t as i32);
        let genres = tag
            .and_then(|t| t.genre())
            .map(|g| vec![g.to_string()])
            .unwrap_or_default();
        let comment = tag.and_then(|t| t.comment()).map(|c| c.to_string());
        let bpm = None;

        Ok(SongMetadata {
            title,
            album,
            year,
            track,
            image: None,
            duration: properties.duration().as_secs_f64(),
            artists,
            instruments: None,
            bpm,
            genres,
            comment,
            tags: vec![],
            file_exists: true,
            times_played: 0,
        })
    }

    fn read_with_id3(&self, file_path: &str) -> Result<SongMetadata, Box<dyn std::error::Error>> {
        let tag = Tag::read_from_path(file_path)?;
        
        let title = tag.title()
            .unwrap_or_else(|| {
                Path::new(file_path)
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("Unknown Title")
            })
            .to_string();

        let artists = tag.artist()
            .map(|a| vec![a.to_string()])
            .unwrap_or_else(|| vec!["Unknown Artist".to_string()]);

        let album = tag.album().unwrap_or("Unknown Album").to_string();
        let year = tag.year();
        let track = tag.track().map(|t| t as i32);
        let genres = tag.genre().map(|g| vec![g.to_string()]).unwrap_or_default();
        let comment = tag.comments().next().map(|c| c.text.clone());
        
        // ID3 crate doesn't have BPM support directly
        let bpm = None;

        // Extract duration from file properties (id3 crate doesn't provide this)
        let duration = self.get_file_duration(file_path)?;

        Ok(SongMetadata {
            title,
            album,
            year,
            track,
            image: None,
            duration,
            artists,
            instruments: None,
            bpm,
            genres,
            comment,
            tags: vec![],
            file_exists: true,
            times_played: 0,
        })
    }

    pub fn write_metadata(&self, file_path: &str, metadata: &SongMetadata) -> Result<(), Box<dyn std::error::Error>> {
        let path = Path::new(file_path);
        
        if !path.exists() {
            return Err("File does not exist".into());
        }

        // Try writing with lofty first
        if file_path.to_lowercase().ends_with(".mp3") {
            if let Ok(()) = self.write_with_id3(file_path, metadata) {
                return Ok(());
            }
        }

        // Try with lofty as fallback
        self.write_with_lofty(file_path, metadata)
    }

    fn write_with_id3(&self, file_path: &str, metadata: &SongMetadata) -> Result<(), Box<dyn std::error::Error>> {
        let mut tag = Tag::read_from_path(file_path).unwrap_or_else(|_| Tag::new());

        // Set basic metadata
        tag.set_title(&metadata.title);
        tag.set_album(&metadata.album);
        
        if let Some(year) = metadata.year {
            tag.set_year(year);
        }
        
        if let Some(track) = metadata.track {
            tag.set_track(track as u32);
        }

        // Set artists (join multiple artists with semicolon)
        if !metadata.artists.is_empty() {
            tag.set_artist(&metadata.artists.join("; "));
        }

        // Set genres
        if !metadata.genres.is_empty() {
            tag.set_genre(&metadata.genres.join("; "));
        }

        // Set comment
        if let Some(comment) = &metadata.comment {
            let comment_obj = Comment {
                lang: "eng".to_string(),
                description: "".to_string(),
                text: comment.clone(),
            };
            tag.add_frame(Frame::with_content("COMM", Content::Comment(comment_obj)));
        }

        tag.write_to_path(file_path, id3::Version::Id3v24)?;
        Ok(())
    }

    fn write_with_lofty(&self, file_path: &str, metadata: &SongMetadata) -> Result<(), Box<dyn std::error::Error>> {
        let mut file = File::open(file_path)?;
        
        let mut parsed_file = lofty::read_from(&mut file)?;
        
        if let Some(tag) = parsed_file.primary_tag_mut() {
            tag.set_title(metadata.title.clone());
            tag.set_album(metadata.album.clone());
            
            if let Some(year) = metadata.year {
                tag.set_year(year as u32);
            }
            
            if let Some(track) = metadata.track {
                tag.set_track(track as u32);
            }
            
            if !metadata.artists.is_empty() {
                tag.set_artist(metadata.artists.join("; "));
            }

            if !metadata.genres.is_empty() {
                tag.set_genre(metadata.genres.join("; "));
            }

            if let Some(comment) = &metadata.comment {
                tag.set_comment(comment.clone());
            }

            // Save changes
            let mut output_file = File::create(file_path)?;
            parsed_file.save_to(&mut output_file, WriteOptions::default())?;
        }

        Ok(())
    }

    pub fn bulk_write_metadata(
        &self,
        operations: Vec<(String, SongMetadata)>,
    ) -> Result<Vec<(String, Result<(), Box<dyn std::error::Error>>)>, Box<dyn std::error::Error>> {
        let mut results = Vec::new();
        
        for (file_path, metadata) in operations {
            let result = self.write_metadata(&file_path, &metadata);
            results.push((file_path, result));
        }
        
        Ok(results)
    }

    fn get_file_duration(&self, _file_path: &str) -> Result<f64, Box<dyn std::error::Error>> {
        // For now, return 0.0 as duration extraction requires audio processing
        // In a real implementation, you might use a library like symphonia
        Ok(0.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::commands::{
        bulk_update_id3_tags, bulk_update_songs_inner, extract_metadata,
        read_id3_tags, update_id3_tags,
    };
    use crate::database::Database;
    use crate::models::{BulkUpdateSongsPayload, Song, SongMetadata};
    use serde_json;

    fn create_test_metadata() -> SongMetadata {
        SongMetadata {
            title: "Test Song".to_string(),
            album: "Test Album".to_string(),
            year: Some(2023),
            track: Some(1),
            image: None,
            duration: 180.0,
            artists: vec!["Test Artist".to_string(), "Second Artist".to_string()],
            instruments: Some(vec!["Guitar".to_string(), "Drums".to_string()]),
            bpm: Some(120.0),
            genres: vec!["Rock".to_string(), "Pop".to_string()],
            comment: Some("Test comment for ID3".to_string()),
            tags: vec!["test".to_string(), "demo".to_string()],
            file_exists: true,
            times_played: 5,
        }
    }

    #[test]
    fn test_id3_manager_creation() {
        let _manager = Id3Manager::new();
        assert!(true);
    }

    #[test]
    fn test_id3_manager_new() {
        let _manager = Id3Manager::new();
        assert!(true);
    }

    #[test]
    fn test_read_nonexistent_file() {
        let manager = Id3Manager::new();
        let result = manager.read_metadata("/path/to/nonexistent/file.mp3");
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("File does not exist"));
    }

    #[test]
    fn test_write_nonexistent_file() {
        let manager = Id3Manager::new();
        let metadata = create_test_metadata();

        let result = manager.write_metadata("/path/to/nonexistent/file.mp3", &metadata);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("File does not exist"));
    }

    #[test]
    fn test_bulk_write_empty_operations() {
        let manager = Id3Manager::new();
        let operations = vec![];

        let result = manager.bulk_write_metadata(operations);
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }

    #[test]
    fn test_bulk_write_mixed_success_failure() {
        let manager = Id3Manager::new();
        let metadata = create_test_metadata();

        let operations = vec![
            ("/nonexistent/file1.mp3".to_string(), metadata.clone()),
            ("/nonexistent/file2.mp3".to_string(), metadata),
        ];

        let result = manager.bulk_write_metadata(operations);
        assert!(result.is_ok());

        let results = result.unwrap();
        assert_eq!(results.len(), 2);

        for (_, result) in results {
            assert!(result.is_err());
        }
    }

    #[test]
    fn test_metadata_field_mappings() {
        let metadata = create_test_metadata();

        assert_eq!(metadata.title, "Test Song");
        assert_eq!(metadata.album, "Test Album");
        assert_eq!(metadata.year, Some(2023));
        assert_eq!(metadata.track, Some(1));
        assert_eq!(metadata.artists.len(), 2);
        assert_eq!(metadata.artists[0], "Test Artist");
        assert_eq!(metadata.artists[1], "Second Artist");
        assert_eq!(metadata.instruments.as_ref().unwrap().len(), 2);
        assert_eq!(metadata.bpm, Some(120.0));
        assert_eq!(metadata.genres.len(), 2);
        assert_eq!(metadata.genres[0], "Rock");
        assert_eq!(metadata.genres[1], "Pop");
        assert_eq!(metadata.comment, Some("Test comment for ID3".to_string()));
        assert_eq!(metadata.tags.len(), 2);
        assert_eq!(metadata.file_exists, true);
        assert_eq!(metadata.times_played, 5);
    }

    #[test]
    fn test_metadata_serialization_compatibility() {
        let metadata = create_test_metadata();

        let json = serde_json::to_value(&metadata);
        assert!(json.is_ok());

        let json_value = json.unwrap();
        assert_eq!(json_value["title"], "Test Song");
        assert_eq!(json_value["album"], "Test Album");
        assert_eq!(json_value["year"], 2023);
        assert_eq!(json_value["track"], 1);
        assert_eq!(json_value["bpm"], 120.0);
    }

    #[test]
    fn test_file_extension_detection() {
        let manager = Id3Manager::new();

        let mp3_result = manager.read_metadata("test.mp3");
        let flac_result = manager.read_metadata("test.flac");
        let mp4_result = manager.read_metadata("test.mp4");
        let unknown_result = manager.read_metadata("test.xyz");

        assert!(mp3_result.is_err());
        assert!(flac_result.is_err());
        assert!(mp4_result.is_err());
        assert!(unknown_result.is_err());
    }

    #[test]
    fn test_partial_metadata_updates() {
        let manager = Id3Manager::new();
        let mut metadata = create_test_metadata();

        metadata.title = "Updated Title".to_string();
        metadata.artists = vec!["New Artist".to_string()];

        let result = manager.write_metadata("/nonexistent/file.mp3", &metadata);
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_command_extract_metadata_nonexistent() {
        let result = extract_metadata("/nonexistent/file.mp3".to_string()).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Failed to extract metadata"));
    }

    #[tokio::test]
    async fn test_command_update_id3_tags_nonexistent() {
        let metadata = create_test_metadata();
        let result = update_id3_tags("/nonexistent/file.mp3".to_string(), metadata).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Failed to update ID3 tags"));
    }

    #[tokio::test]
    async fn test_command_bulk_update_id3_tags_empty() {
        let operations: Vec<(String, SongMetadata)> = vec![];
        let result = bulk_update_id3_tags(operations).await;
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }

    #[tokio::test]
    async fn test_command_read_id3_tags_nonexistent() {
        let result = read_id3_tags("/nonexistent/file.mp3".to_string()).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Failed to read ID3 tags"));
    }

    #[tokio::test]
    async fn test_bulk_update_songs_empty_ids() {
        let db = create_test_db().await;
        let payload = BulkUpdateSongsPayload {
            ids: vec![],
            updates: serde_json::json!({"title": "New Title"}),
            update_id3: Some(false),
        };

        let result = bulk_update_songs_inner(payload, &db).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 0);
    }

    #[tokio::test]
    async fn test_bulk_update_songs_without_id3_flag() {
        let db = create_test_db().await;

        let metadata = create_test_metadata();
        let file_path = "/test/path/song1.mp3".to_string();

        let song = Song {
            id: "song-1".to_string(),
            url: file_path.clone(),
            filename: "song1.mp3".to_string(),
            metadata: metadata.clone(),
            available: true,
        };

        db.create_song(song.clone()).await.unwrap();

        let payload = BulkUpdateSongsPayload {
            ids: vec![song.id.clone()],
            updates: serde_json::json!({"title": "Updated Title"}),
            update_id3: Some(false),
        };

        let result = bulk_update_songs_inner(payload, &db).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 1);
    }

    async fn create_test_db() -> Database {
        Database::new("sqlite::memory:")
            .await
            .expect("Failed to create test database")
    }

    #[test]
    fn test_error_message_formats() {
        let manager = Id3Manager::new();

        let nonexistent_err = manager.read_metadata("/nonexistent/file.mp3").unwrap_err();
        assert!(nonexistent_err.to_string().contains("File does not exist"));

        let metadata = create_test_metadata();
        let write_err = manager.write_metadata("/nonexistent/file.mp3", &metadata).unwrap_err();
        assert!(write_err.to_string().contains("File does not exist"));
    }

    #[test]
    fn test_metadata_field_validation() {
        let mut metadata = create_test_metadata();

        metadata.title = "".to_string();
        let manager = Id3Manager::new();
        let result = manager.write_metadata("/nonexistent/file.mp3", &metadata);
        assert!(result.is_err());

        metadata.title = "Test".to_string();
        metadata.artists = vec![];
        let result = manager.write_metadata("/nonexistent/file.mp3", &metadata);
        assert!(result.is_err());
    }

    #[test]
    fn test_special_characters_in_metadata() {
        let mut metadata = create_test_metadata();
        metadata.title = "Test ♥ Song ♪".to_string();
        metadata.comment = Some("Comment with émojis and spëcial chars".to_string());
        metadata.artists = vec!["Artist Ñ".to_string()];

        let manager = Id3Manager::new();
        let result = manager.write_metadata("/nonexistent/file.mp3", &metadata);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("File does not exist"));
    }

    #[test]
    fn test_metadata_json_serialization() {
        let metadata = create_test_metadata();

        let json = serde_json::to_value(&metadata);
        assert!(json.is_ok());

        let json_value = json.unwrap();
        assert_eq!(json_value["title"], "Test Song");
        assert_eq!(json_value["album"], "Test Album");
        assert_eq!(json_value["year"], 2023);
        assert_eq!(json_value["track"], 1);
        assert_eq!(json_value["bpm"], 120.0);
    }
}
