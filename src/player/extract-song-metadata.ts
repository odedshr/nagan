import { parseBlob } from "music-metadata";
import { SongMetadata } from "../types.ts";

export default async function extractSongMetadata(file: File):Promise<SongMetadata> {
    const rawMetaData = await parseBlob(file);
    const SongMetadata: SongMetadata = {
        title: rawMetaData.common.title || file.name,
        artists: rawMetaData.common.artists || "Unknown Artist",
        album: rawMetaData.common.album || "Unknown Album",
        picture: rawMetaData.common.picture || [],
        duration: rawMetaData.format.duration || 0,
        genres: rawMetaData.common.genre || [],
        tags: rawMetaData.common.label || [],
        file_exists: true,
        times_played: 0,
    };

    return SongMetadata;
}