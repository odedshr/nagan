import { SongGroupsResponseItem } from '../backend/backend.ts';
import { initState, StateTemplate } from '../utils/init-state.ts';
import { Song } from '../types.ts';

export type SongDatabaseStateBase = {
  db: Song[];
  totalSongs: number;
  groups: SongGroupsResponseItem[];
};

export type SongDatabaseState = StateTemplate<SongDatabaseStateBase>;

export function createSongDatabaseState(initial?: Partial<SongDatabaseStateBase>): SongDatabaseState {
  return initState({
    db: [],
    totalSongs: 0,
    groups: [],
    ...initial,
  }) as SongDatabaseState;
}
