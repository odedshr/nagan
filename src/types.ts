import { IPicture } from "music-metadata";

export interface Player {
    setMetadata(data: {
        title: string;
        artist: string;
        picture: IPicture[];
        duration: number;
    }): void;
    setCurrentTime(time: number): void;
    setFileSelectedHandler(handler: (file: File) => void): void;
    setAudioToggleHandler(handler: (isPlaying: boolean) => void): void;
    setPositionUpdateHandler(handler: (time: number) => void): void;
    getDivElement(): HTMLDivElement;
}

export interface TrackMetadata {
    title: string;
    artist: string;
    picture: IPicture[];
    duration: number;
}