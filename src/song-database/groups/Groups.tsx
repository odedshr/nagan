/// <reference path="../../jsx.d.ts" />

import { SongGroupsResponseItem } from '../../backend/backend.ts';
import jsx from '../../jsx.js';
import DropDown from '../../ui-components/dropdown/Dropdown.tsx';

const SORT_BY_OPTIONS = ['valueAsec', 'valueDesc', 'countAsec', 'countDesc'] as const;

const SORT_BY_LABELS: Record<(typeof SORT_BY_OPTIONS)[number], string> = {
  valueAsec: 'Value: A→Z',
  valueDesc: 'Value: Z→A',
  countAsec: 'Count: Low→High',
  countDesc: 'Count: High→Low',
};

export default (groups: SongGroupsResponseItem[]) =>
  (
    <div class="db-groups">
      {groups.map(
        group =>
          (
            <ul class="group" title={group.name}>
              <li>
                <div class="group-header">
                  <h3 class="group-title">{group.name}</h3>
                  {DropDown({
                    wrapperClass: 'group-sort-dropdown',
                    buttonClass: 'std-button group-sort-button',
                    buttonContent: ['Sort: ', SORT_BY_LABELS[group.sortBy] ?? group.sortBy],
                    menuClass: 'group-sort-menu',
                    menuContent: SORT_BY_OPTIONS.map(option => (
                      <li class="group-sort-item" data-id={option}>
                        <button
                          class="group-sort-option"
                          data-action="group-sort-by"
                          data-group={group.name}
                          data-sort-by={option}
                          disabled={option === group.sortBy}
                        >
                          {SORT_BY_LABELS[option] ?? option}
                        </button>
                      </li>
                    )),
                  })}
                </div>
              </li>
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
