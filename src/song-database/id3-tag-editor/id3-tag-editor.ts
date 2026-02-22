import { Song, SongMetadata } from '../../types.ts';
import { openInModal } from '../../ui-components/modal/modal.ts';
import Id3TagEditorUI from './Id3TagEditor.tsx';

type GetSongBpm = (songId: string) => Promise<number | null>;
type GetSongGenres = (songId: string) => Promise<string[] | null>;

export type Id3TagEditorResult = {
  updatedTags: Partial<SongMetadata>;
  analyzedBpms?: Record<string, number>;
  analyzedGenres?: Record<string, string[]>;
};

interface Id3TagEditorProps {
  songs: Song[];
  getSongBpm: GetSongBpm;
  getSongGenres?: GetSongGenres;
  onSubmit: (result: Id3TagEditorResult | null) => void;
}

function handleSubmit(e: SubmitEvent, onSubmit: (result: Id3TagEditorResult | null) => void) {
  e.preventDefault();
  if (e.submitter && (e.submitter as HTMLButtonElement).getAttribute('data-value') === 'false') {
    onSubmit(null);
    return;
  }

  const formData = new FormData(e.currentTarget as HTMLFormElement);
  const rawArtists = formData.get('artists') as string;
  const artists = !rawArtists
    ? undefined
    : rawArtists.indexOf(',') > -1
      ? rawArtists.split(',').map(s => s.trim())
      : rawArtists.trim();

  const rawGenres = (formData.get('genres') as string) || '';
  const trimmedGenres = rawGenres.trim();
  const genres = !trimmedGenres
    ? undefined
    : trimmedGenres.indexOf(',') > -1
      ? trimmedGenres
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      : [trimmedGenres];

  const rawYear = (formData.get('year') as string) || '';
  const parsedYear = rawYear.trim() ? Number.parseInt(rawYear, 10) : undefined;
  const year = parsedYear !== undefined && Number.isFinite(parsedYear) ? parsedYear : undefined;

  const rawBpm = (formData.get('bpm') as string) || '';
  const parsedBpm = rawBpm.trim() ? Number.parseFloat(rawBpm) : undefined;
  const bpm = parsedBpm !== undefined && Number.isFinite(parsedBpm) ? parsedBpm : undefined;

  const comment = (formData.get('comment') as string) || '';

  const updatedTags: Partial<SongMetadata> = {};
  if (formData.get('tag-title-enabled')) {
    updatedTags.title = (formData.get('title') as string) || undefined;
  }
  if (formData.get('tag-artists-enabled')) {
    updatedTags.artists = artists;
  }
  if (formData.get('tag-album-enabled')) {
    updatedTags.album = (formData.get('album') as string) || undefined;
  }
  if (formData.get('tag-year-enabled')) {
    updatedTags.year = year;
  }
  if (formData.get('tag-bpm-enabled')) {
    updatedTags.bpm = bpm;
  }
  if (formData.get('tag-genres-enabled')) {
    updatedTags.genres = genres;
  }
  if (formData.get('tag-comment-enabled')) {
    updatedTags.comment = comment;
  }

  const hasManualBpm = formData.get('tag-bpm-enabled') && updatedTags.bpm !== undefined;
  const hasManualGenres = formData.get('tag-genres-enabled') && updatedTags.genres !== undefined;

  let analyzedBpms: Record<string, number> | undefined = undefined;
  if (!hasManualBpm) {
    const rawAnalyzed = (formData.get('analyzed-bpms') as string) || '';
    const trimmed = rawAnalyzed.trim();
    if (trimmed) {
      try {
        const parsed = JSON.parse(trimmed) as Record<string, number>;
        if (parsed && typeof parsed === 'object') {
          analyzedBpms = parsed;
        }
      } catch {
        // Ignore malformed analyzed BPM payload.
      }
    }
  }

  let analyzedGenres: Record<string, string[]> | undefined = undefined;
  if (!hasManualGenres) {
    const rawAnalyzed = (formData.get('analyzed-genres') as string) || '';
    const trimmed = rawAnalyzed.trim();
    if (trimmed) {
      try {
        const parsed = JSON.parse(trimmed) as Record<string, string[]>;
        if (parsed && typeof parsed === 'object') {
          analyzedGenres = parsed;
        }
      } catch {
        // Ignore malformed analyzed genres payload.
      }
    }
  }

  onSubmit({ updatedTags, analyzedBpms, analyzedGenres });
}

function Id3TagEditor({ songs, getSongBpm, getSongGenres, onSubmit }: Id3TagEditorProps) {
  return Id3TagEditorUI(songs, (e: SubmitEvent) => handleSubmit(e, onSubmit), getSongBpm, getSongGenres);
}

export default async function editId3Tags(
  songs: Song[],
  getSongBpm: GetSongBpm,
  getSongGenres?: GetSongGenres
): Promise<Id3TagEditorResult | null> {
  return openInModal(Id3TagEditor, { songs, getSongBpm, getSongGenres, onSubmit: () => {} });
}
