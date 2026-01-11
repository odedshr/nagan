
import { BackendService, GetSongsQuery, GetSongsResponse, Song, SongMetadata } from "../types";

export default class WebBackendService implements BackendService {
  getSongs(query: GetSongsQuery): Promise<GetSongsResponse> {
    console.error('getSongs not implemented in WebBackendService');
    return Promise.resolve({ songs: [], total: 0 });
  }

  async addSong(filePath: string, metadata: SongMetadata): Promise<Song> {
    console.error('not implemented yet: addSong');
    return Promise.resolve({
      id: '0',
      title: metadata.title,
      artists: metadata.artists,
      album: metadata.album,
      duration: metadata.duration,
      file_path: filePath,
      file_exists: true,
      times_played: 0,
      genres: metadata.genres,
      tags: metadata.tags,
    } as unknown as Song);
  }
}