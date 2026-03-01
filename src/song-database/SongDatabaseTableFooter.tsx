/// <reference path="../jsx.d.ts" />

import jsx from '../jsx.js';

export type SongDatabaseTableFooterProps = {
  columns: string[];
  totalSongs?: number;
  selectedSongs?: number;
};

export default ({ columns, totalSongs, selectedSongs }: SongDatabaseTableFooterProps) => {
  return (
    <tfoot>
      <tr>
        <td colspan={columns.length}>
          {selectedSongs ?? 0} of {totalSongs ?? 0} songs
        </td>
      </tr>
    </tfoot>
  ) as HTMLTableSectionElement;
};
