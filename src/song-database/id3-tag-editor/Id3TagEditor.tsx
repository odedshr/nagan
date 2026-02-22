/// <reference path="../../jsx.d.ts" />

import jsx from '../../jsx.js';

import { Song, SongMetadata } from '../../types.ts';
import openProgressModal, { ProgressModalHandle } from '../../ui-components/progress/Progress.tsx';

type GetSongBpm = (songId: string) => Promise<number | null>;
type GetSongGenres = (songId: string) => Promise<string[] | null>;

function toggleField(e: Event) {
  const checkbox = e.target as HTMLInputElement;
  const fieldName = checkbox.name.replace('-enabled', '');
  const input = document.getElementById(fieldName) as HTMLInputElement | HTMLTextAreaElement;
  input.disabled = !checkbox.checked;
}

export default function Id3TagEditor(
  songs: Song[],
  handleSubmit: (e: SubmitEvent) => void,
  getSongBpm?: GetSongBpm,
  getSongGenres?: GetSongGenres
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

  const clearAnalyzedGenres = () => {
    const hidden = document.getElementById('analyzed-genres') as HTMLInputElement | null;
    if (hidden) hidden.value = '';
    const indicator = document.getElementById('genres-analyzed-indicator') as HTMLSpanElement | null;
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

  const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

  const analyzeGenres = async (
    songsToAnalyze: Song[],
    progressHandle?: ProgressModalHandle
  ): Promise<Record<string, string[]> | null> => {
    if (!getSongGenres) return null;

    const ownsProgress = !progressHandle;
    const progress = progressHandle ?? openProgressModal('Fetching Genres', songsToAnalyze.length);
    const results: Record<string, string[]> = {};

    try {
      for (let i = 0; i < songsToAnalyze.length; i++) {
        if (progress.isCancelled()) {
          return null;
        }

        const s = songsToAnalyze[i];
        progress.update(i, songsToAnalyze.length, s.metadata.title || s.filename);

        const genres = await getSongGenres(s.id);

        progress.update(i + 1, songsToAnalyze.length, s.metadata.title || s.filename);

        if (progress.isCancelled()) {
          return null;
        }

        if (genres && Array.isArray(genres) && genres.length) {
          results[s.id] = genres;
        }

        // MusicBrainz is rate-limited; keep requests spaced out.
        if (i < songsToAnalyze.length - 1) {
          await sleep(1100);
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to fetch genres:', error);
      return null;
    } finally {
      if (ownsProgress) {
        progress.close();
      }
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

  const onGetGenresClick = (e: MouseEvent) => {
    e.preventDefault();
    if (!getSongGenres) return;

    const button = e.target as HTMLButtonElement;
    button.disabled = true;

    void (async () => {
      const progress = openProgressModal('Fetching Genres', songs.length);
      try {
        clearAnalyzedGenres();

        const results = await analyzeGenres(songs, progress);
        if (!results) {
          return;
        }

        const enabledCheckbox = document.getElementById('tag-genres-enabled') as HTMLInputElement | null;
        const genresInput = document.getElementById('tag-genres') as HTMLInputElement | null;

        if (songs.length === 1) {
          const genres = results[songs[0].id];
          if (!genres || !genres.length) {
            console.warn('Could not determine genres for song', songs[0].id);
            return;
          }

          if (enabledCheckbox) {
            enabledCheckbox.checked = true;
          }
          if (genresInput) {
            genresInput.disabled = false;
            genresInput.value = genres.join(', ');
          }
          return;
        }

        // Multi-select: store per-song results for save-time application.
        // Disable the manual genres field so it doesn't override the analyzed payload.
        if (enabledCheckbox) {
          enabledCheckbox.checked = false;
        }
        if (genresInput) {
          genresInput.disabled = true;
          genresInput.value = '';
        }

        const hidden = document.getElementById('analyzed-genres') as HTMLInputElement | null;
        if (hidden) {
          hidden.value = JSON.stringify(results);
        }

        const indicator = document.getElementById('genres-analyzed-indicator') as HTMLSpanElement | null;
        if (indicator) {
          indicator.textContent = Object.keys(results).length ? 'Various' : '';
        }
      } catch (error) {
        console.error('Failed to fetch genres:', error);
      } finally {
        progress.close();
        button.disabled = false;
      }
    })();
  };

  const onAnalyzeGenresClick = (e: MouseEvent) => {
    e.preventDefault();
    // Multi-select uses the same flow now.
    onGetGenresClick(e);
  };

  const onGenresManualChange = (_e: Event) => {
    // Manual edit should override analyzed genres.
    clearAnalyzedGenres();
  };

  const onBpmManualChange = (_e: Event) => {
    // Manual edit should override analyzed BPMs.
    clearAnalyzedBpms();
  };

  return (
    <form method="dialog" onsubmit={handleSubmit} class="modal-form id3-tags-editor-form">
      <input type="hidden" id="analyzed-bpms" name="analyzed-bpms" value="" />
      <input type="hidden" id="analyzed-genres" name="analyzed-genres" value="" />
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
          <input
            type="text"
            name="genres"
            id="tag-genres"
            value={genresValue}
            onchange={onGenresManualChange}
            oninput={onGenresManualChange}
            disabled={!commonTags.genres?.length}
          />
          <span id="genres-analyzed-indicator" class="modal-message"></span>
          {getSongGenres ? (
            songs.length === 1 ? (
              <button type="button" class="std-button" onclick={onGetGenresClick}>
                Get Genres
              </button>
            ) : (
              <button type="button" class="std-button" onclick={onAnalyzeGenresClick}>
                Analyze Genres
              </button>
            )
          ) : null}
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
