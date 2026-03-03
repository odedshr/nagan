/// <reference path="../jsx.d.ts" />

import jsx from '../jsx.js';

export type StatusBarProps = {
  totalSongs?: number;
  selectedSongs?: number;
  bidiPageSizeSelector: (selectElm: HTMLSelectElement) => void;
  pageNumber: number;
  pageSize: number;
};

export default ({ totalSongs, selectedSongs, pageNumber, pageSize, bidiPageSizeSelector }: StatusBarProps) => {
  const totalPages = pageSize ? Math.ceil((totalSongs ?? 0) / pageSize) : 0;
  const elm = (
    <div class="status-bar">
      <span class="selection">
        {totalSongs} song{totalSongs === 1 ? '' : 's'}
        {selectedSongs ? ` (${selectedSongs} selected)` : ''}
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
      <select class="page-size-select" name="page-size">
        {[20, 50, 100, 500, 0].map(size => (
          <option value={size} selected={+pageSize === size}>
            {size === 0 ? 'All' : `${size} per page`}
          </option>
        ))}
      </select>
    </div>
  ) as HTMLDivElement;
  bidiPageSizeSelector(elm.querySelector('.page-size-select') as HTMLSelectElement);
  return elm;
};
