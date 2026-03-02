/// <reference path="../jsx.d.ts" />

import jsx from '../jsx.js';

export type SongDatabaseTableFooterProps = {
  columns: string[];
  totalSongs?: number;
  selectedSongs?: number;
  pageNumber: number;
  pageSize: number;
};

export default ({ columns, totalSongs, selectedSongs, pageNumber, pageSize }: SongDatabaseTableFooterProps) => {
  const totalPages = pageSize ? Math.ceil((totalSongs ?? 0) / pageSize) : 0;
  return (
    <tfoot>
      <tr>
        <td colspan={columns.length}>
          <div class="table-footer">
            <span class="selection">
              {selectedSongs ? `${selectedSongs} of ${totalSongs} songs selected` : `${totalSongs} songs`}
            </span>
            {totalPages > 1 ? (
              <span class="pagination">
                <button class="std-button icon-button" data-action="first-page" disabled={pageNumber === 0}>
                  |&lt;
                </button>
                <button class="std-button icon-button" data-action="previous-page" disabled={pageNumber === 0}>
                  &lt;
                </button>
                {pageNumber + 1} of {totalPages} pages
                <button class="std-button icon-button" data-action="next-page" disabled={pageNumber >= totalPages - 1}>
                  &gt;
                </button>
                <button class="std-button icon-button" data-action="last-page" disabled={pageNumber >= totalPages - 1}>
                  &gt;|
                </button>
              </span>
            ) : (
              ''
            )}
          </div>
        </td>
      </tr>
    </tfoot>
  ) as HTMLTableSectionElement;
};
