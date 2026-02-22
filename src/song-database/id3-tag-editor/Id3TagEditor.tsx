/// <reference path="../../jsx.d.ts" />

import jsx from '../../jsx.js';

import { Song, SongMetadata } from '../../types.ts';
import openProgressModal from '../../ui-components/progress/Progress.tsx';

type GetSongBpm = (songId: string) => Promise<number | null>;

function toggleField(e: Event) {
  const checkbox = e.target as HTMLInputElement;
  const fieldName = checkbox.name.replace('-enabled', '');
  const input = document.getElementById(fieldName) as HTMLInputElement | HTMLTextAreaElement;
  input.disabled = !checkbox.checked;
}

export default function Id3TagEditor(
  songs: Song[],
  handleSubmit: (e: SubmitEvent) => void,
  getSongBpm?: GetSongBpm
): HTMLFormElement {
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

  const artists = commonTags.artists
    ? Array.isArray(commonTags.artists)
      ? commonTags.artists.join(', ')
      : commonTags.artists
    : '';

  const genresValue = commonTags.genres ? commonTags.genres.join(', ') : '';
  const bpmValue = commonTags.bpm ?? '';
  const commentValue = commonTags.comment ?? '';

  const clearAnalyzedBpms = () => {
    const hidden = document.getElementById('analyzed-bpms') as HTMLInputElement | null;
    if (hidden) hidden.value = '';
    const indicator = document.getElementById('bpm-analyzed-indicator') as HTMLSpanElement | null;
    if (indicator) indicator.textContent = '';
  };

  const analyzeBpms = async (songsToAnalyze: Song[]): Promise<Record<string, number> | null> => {
    if (!getSongBpm) return null;

    const progress = openProgressModal('Analyzing BPM', songsToAnalyze.length);
    const results: Record<string, number> = {};

    try {
      for (let i = 0; i < songsToAnalyze.length; i++) {
        if (progress.isCancelled()) {
          return null;
        }

        const s = songsToAnalyze[i];
        progress.update(i + 1, songsToAnalyze.length, s.metadata.title || s.filename);

        const bpm = await getSongBpm(s.id);

        if (progress.isCancelled()) {
          return null;
        }

        if (bpm !== null && bpm !== undefined && Number.isFinite(bpm)) {
          results[s.id] = Math.round(bpm);
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to analyze BPMs:', error);
      return null;
    } finally {
      progress.close();
    }
  };

  const onGetBpmClick = (e: MouseEvent) => {
    e.preventDefault();
    if (!getSongBpm) return;
    if (songs.length !== 1) return;

    const button = e.target as HTMLButtonElement;
    button.disabled = true;

    void (async () => {
      try {
        clearAnalyzedBpms();
        const results = await analyzeBpms([songs[0]]);
        if (!results || results[songs[0].id] === undefined) {
          console.warn('Could not determine BPM for song', songs[0].id);
          return;
        }

        const bpm = results[songs[0].id];

        const enabledCheckbox = document.getElementById('tag-bpm-enabled') as HTMLInputElement | null;
        const bpmInput = document.getElementById('tag-bpm') as HTMLInputElement | null;

        if (enabledCheckbox) {
          enabledCheckbox.checked = true;
        }
        if (bpmInput) {
          bpmInput.disabled = false;
          bpmInput.value = String(bpm);
        }
      } catch (error) {
        console.error('Failed to analyze BPM:', error);
      } finally {
        button.disabled = false;
      }
    })();
  };

  const onAnalyzeBpmsClick = (e: MouseEvent) => {
    e.preventDefault();
    if (!getSongBpm) return;
    if (songs.length <= 1) return;

    const button = e.target as HTMLButtonElement;
    button.disabled = true;

    void (async () => {
      try {
        clearAnalyzedBpms();

        const results = await analyzeBpms(songs);
        if (!results) {
          return;
        }

        const hidden = document.getElementById('analyzed-bpms') as HTMLInputElement | null;
        if (hidden) {
          hidden.value = JSON.stringify(results);
        }

        const indicator = document.getElementById('bpm-analyzed-indicator') as HTMLSpanElement | null;
        if (indicator) {
          indicator.textContent = 'Various';
        }
      } finally {
        button.disabled = false;
      }
    })();
  };

  const onBpmManualChange = (_e: Event) => {
    // Manual edit should override analyzed BPMs.
    clearAnalyzedBpms();
  };

  return (
    <form method="dialog" onsubmit={handleSubmit} class="modal-form id3-tags-editor-form">
      <input type="hidden" id="analyzed-bpms" name="analyzed-bpms" value="" />
      <h2>{songs.length > 1 ? `${songs.length} Songs` : songs[0].metadata.title}</h2>
      <section class="tags-section">
        <div class="tag-field">
          <input
            type="checkbox"
            name="tag-title-enabled"
            id="tag-title-enabled"
            checked={!!commonTags.title}
            onchange={toggleField}
          />
          <label for="tag-title">Title:</label>
          <input type="text" name="title" id="tag-title" value={commonTags.title || ''} disabled={!commonTags.title} />
        </div>
        <div class="tag-field">
          <input
            type="checkbox"
            name="tag-artists-enabled"
            id="tag-artists-enabled"
            checked={!!commonTags.artists}
            onchange={toggleField}
          />
          <label for="tag-artists">Artist:</label>
          <input type="text" name="artists" id="tag-artists" value={artists} disabled={!commonTags.artists} />
        </div>
        <div class="tag-field">
          <input
            type="checkbox"
            name="tag-album-enabled"
            id="tag-album-enabled"
            checked={!!commonTags.album}
            onchange={toggleField}
          />
          <label for="tag-album">Album:</label>
          <input type="text" name="album" id="tag-album" value={commonTags.album || ''} disabled={!commonTags.album} />
        </div>
        <div class="tag-field">
          <input
            type="checkbox"
            name="tag-year-enabled"
            id="tag-year-enabled"
            checked={!!commonTags.year}
            onchange={toggleField}
          />
          <label for="tag-year">Year:</label>
          <input type="number" name="year" id="tag-year" value={commonTags.year || ''} disabled={!commonTags.year} />
        </div>
        <div class="tag-field">
          <input
            type="checkbox"
            name="tag-bpm-enabled"
            id="tag-bpm-enabled"
            checked={commonTags.bpm !== undefined}
            onchange={toggleField}
          />
          <label for="tag-bpm">BPM:</label>
          <input
            type="number"
            name="bpm"
            id="tag-bpm"
            step="0.1"
            value={bpmValue}
            onchange={onBpmManualChange}
            oninput={onBpmManualChange}
            disabled={commonTags.bpm === undefined}
          />
          <span id="bpm-analyzed-indicator" class="modal-message"></span>
          {getSongBpm ? (
            songs.length === 1 ? (
              <button type="button" class="std-button" onclick={onGetBpmClick}>
                Get BPM
              </button>
            ) : (
              <button type="button" class="std-button" onclick={onAnalyzeBpmsClick}>
                Analyze BPMs
              </button>
            )
          ) : null}
        </div>
        <div class="tag-field">
          <input
            type="checkbox"
            name="tag-genres-enabled"
            id="tag-genres-enabled"
            checked={!!commonTags.genres?.length}
            onchange={toggleField}
          />
          <label for="tag-genres">Genre:</label>
          <input type="text" name="genres" id="tag-genres" value={genresValue} disabled={!commonTags.genres?.length} />
        </div>
        <div class="tag-field">
          <input
            type="checkbox"
            name="tag-comment-enabled"
            id="tag-comment-enabled"
            checked={!!commonTags.comment}
            onchange={toggleField}
          />
          <label for="tag-comment">Comment:</label>
          <input type="text" name="comment" id="tag-comment" value={commentValue} disabled={!commonTags.comment} />
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
