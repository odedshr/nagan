/// <reference path="../JSX.d.ts" />

import { SongGroupsGroupResponseItem } from '../backend/backend.ts';
import jsx from '../jsx.js';

export default (groups: SongGroupsGroupResponseItem[]) =>
  (
    <div class="db-groups">
      {groups.map(
        group =>
          (
            <ul class="group" title={group.name}>
              {group.items.map(
                item =>
                  (
                    <li>
                      <button
                        class="bare-button"
                        disabled={group.selected === item.name}
                        title={item.name}
                        data-count={item.count}
                        data-group={group.name}
                        data-action="group-select"
                      >
                        {item.name}
                      </button>
                    </li>
                  ) as HTMLLIElement
              )}
            </ul>
          ) as HTMLUListElement
      )}
    </div>
  ) as HTMLDivElement;
