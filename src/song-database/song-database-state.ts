import { SongGroupsResponseItem } from '../backend/backend.ts';
import { Context, StateTemplate } from '../utils/context.ts';
import { Song } from '../types.ts';

export type SongDatabaseStateBase = {
  db: Song[];
  groups: SongGroupsResponseItem[];
  artistFilter: string;
};

export type SongDatabaseState = StateTemplate<SongDatabaseStateBase>;

export function createSongDatabaseState(initial?: Partial<SongDatabaseStateBase>): SongDatabaseState {
  return Context({
    db: [],
    groups: [],
    artistFilter: '',
    ...initial,
  }) as SongDatabaseState;
}
