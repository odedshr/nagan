import { Song, SongMetadata } from '../../types.ts';
import { openInModal } from '../../ui-components/modal/modal.ts';
import Id3TagEditorUI from './Id3TagEditor.tsx';

interface Id3TagEditorProps {
  songs: Song[];
  onSubmit: (updatedTags: Partial<SongMetadata> | null) => void;
}

function handleSubmit(e: SubmitEvent, onSubmit: (updatedTags: Partial<SongMetadata> | null) => void) {
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

  onSubmit(updatedTags);
}

function Id3TagEditor({ songs, onSubmit }: Id3TagEditorProps) {
  return Id3TagEditorUI(songs, (e: SubmitEvent) => handleSubmit(e, onSubmit));
}

export default async function editId3Tags(songs: Song[]): Promise<Partial<SongMetadata> | null> {
  return openInModal(Id3TagEditor, { songs, onSubmit: () => {} });
}
