/// <reference path="../jsx.d.ts" />

import jsx from '../jsx.js';

export type SongDatabaseProps = {
  groups: HTMLDivElement;
  columns: string[];
  toolbar: HTMLDivElement;
  header: HTMLTableSectionElement;
  body: HTMLTableSectionElement;
  statusBar: HTMLDivElement;
};

export default ({ groups, columns, toolbar, header, body, statusBar }: SongDatabaseProps) => {
  return (
    <form class="song-database-container">
      {toolbar}
      {groups}
      <div class="db-table-scroll">
        <table class="db-table" cellpadding="0" cellspacing="0">
          <colgroup>
            {columns.map(column => (
              <col class={`${column}-col`}></col>
            ))}
          </colgroup>
          {header}
          {body}
        </table>
      </div>
      {statusBar}
    </form>
  ) as HTMLFormElement;
};
