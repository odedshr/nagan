
import { BackendService, GetSongsQuery, GetSongsResponse, Song, SongMetadata } from "../types";

export default class WebBackendService implements BackendService {
  getSongs(query: GetSongsQuery): Promise<GetSongsResponse> {
    throw new Error("Method not implemented.");
  }
  
  async addSong(filePath: string, metadata: SongMetadata): Promise<Song> {
    throw Error('not implemented yet: addSong');
  }
}