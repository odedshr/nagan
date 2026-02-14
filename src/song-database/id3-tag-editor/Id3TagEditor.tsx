/// <reference path="../../JSX.d.ts" />

import jsx from '../../jsx.js';

import { Song, SongMetadata } from '../../types.ts';
import { openInModal } from '../../ui-components/modal/modal.ts';

interface Id3TagEditorProps {
  songs: Song[];
  onSubmit: (updatedSongs: Song[]) => void;
}

function Id3TagEditor({ songs, onSubmit }: Id3TagEditorProps) {
  const commonTags: Partial<SongMetadata> = songs.reduce(
    (common, song) => {
      for (const key in common) {
        if (common[key as keyof SongMetadata] !== song.metadata[key as keyof SongMetadata]) {
          delete common[key as keyof SongMetadata];
        }
      }
      return common;
    },
    { ...songs[0].metadata } as Partial<SongMetadata>
  );

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const updatedTags: Partial<SongMetadata> = {
      title: (formData.get('title') as string) || undefined,
      artists: (formData.get('artists') as string) || undefined,
      album: (formData.get('album') as string) || undefined,
    };
    onSubmit(songs.map(song => ({ ...song, metadata: { ...song.metadata, ...updatedTags } })));
  };

  return (
    <form method="dialog" onsubmit={handleSubmit} class="modal-form id3-tags-editor-form">
      <h2>{songs.length > 1 ? `${songs.length} Songs` : songs[0].metadata.title}</h2>
      <section class="tags-section">
        <div class="tag-field">
          <input type="checkbox" name="edit-title" id="edit-title" checked={!!commonTags.title} />
          <label for="title">Title:</label>
          <input type="text" name="title" id="title" value={commonTags.title || ''} />
        </div>
        <div class="tag-field">
          <input type="checkbox" name="edit-artists" id="edit-artists" checked={!!commonTags.artists} />
          <label for="artists">Artist:</label>
          <input type="text" name="artists" id="artists" value={commonTags.artists || ''} />
        </div>
        <div class="tag-field">
          <input type="checkbox" name="edit-album" id="edit-album" checked={!!commonTags.album} />
          <label for="album">Album:</label>
          <input type="text" name="album" id="album" value={commonTags.album || ''} />
        </div>
      </section>
      <div class="modal-buttons">
        <button class="std-button" data-value="false">
          Cancel
        </button>
        <button class="std-button primary-btn" data-value="true">
          Save
        </button>
      </div>
    </form>
  ) as HTMLFormElement;
}

export default async function editId3Tags(songs: Song[]): Promise<Song[]> {
  return openInModal(Id3TagEditor, { songs, onSubmit: () => {} });
}
