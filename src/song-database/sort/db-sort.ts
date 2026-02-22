import type { DbSortDirection, DbSortItem, DbSortKey } from '../../types.ts';

const SORT_SQL: Record<DbSortKey, string> = {
  title: 'title',
  album: 'album',
  year: 'year',
  bpm: 'bpm',
  duration: 'duration',
  track: 'track',
  filename: 'filename',
  timesPlayed: 'times_played',
  comment: "COALESCE(comment, '')",
  artists: "COALESCE(json_extract(artists, '$[0]'), '')",
  genre: "COALESCE(json_extract(genres, '$[0]'), '')",
};

function toSqlDirection(direction: DbSortDirection): 'ASC' | 'DESC' {
  return direction === 'desc' ? 'DESC' : 'ASC';
}

export function dbSortToOrderBy(sort: DbSortItem[] | undefined | null): string | undefined {
  if (!sort?.length) {
    return undefined;
  }

  const parts: string[] = [];
  for (const item of sort) {
    const expr = SORT_SQL[item.key];
    if (!expr) continue;
    parts.push(`${expr} ${toSqlDirection(item.direction)}`);
  }

  return parts.length ? parts.join(', ') : undefined;
}
