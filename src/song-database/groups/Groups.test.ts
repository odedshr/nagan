import { describe, expect, it } from 'vitest';

import type { SongGroupsResponseItem } from '../../backend/backend.ts';
import Groups from './Groups.tsx';

describe('Groups', () => {
  it('renders groups, items, and disables selected item', () => {
    const groups = [
      {
        name: 'album',
        selected: 'Kind of Blue',
        sortBy: 'valueDesc',
        items: [
          { name: 'Kind of Blue', count: 2 },
          { name: 'Bitches Brew', count: 1 },
        ],
      },
      {
        name: 'artists',
        selected: null,
        sortBy: 'countDesc',
        items: [{ name: 'Miles Davis', count: 10 }],
      },
    ] as unknown as SongGroupsResponseItem[];

    const elm = Groups(groups);

    expect(elm.classList.contains('db-groups')).toBe(true);

    const renderedGroups = elm.querySelectorAll('ul.group');
    expect(renderedGroups.length).toBe(2);

    const firstGroupTitle = (renderedGroups[0].querySelector('h3.group-title') as HTMLHeadingElement).textContent;
    expect((firstGroupTitle ?? '').trim()).toBe('album');

    const selectedButton = elm.querySelector(
      'button.bare-button[data-action="group-select"][data-group="album"][title="Kind of Blue"]'
    ) as HTMLButtonElement;
    expect(selectedButton.disabled).toBe(true);

    const sortMenu = renderedGroups[0].querySelector('ul.group-sort-menu')!;
    const sortOptions = sortMenu.querySelectorAll('button.group-sort-option');
    expect(sortOptions.length).toBe(4);

    const currentSort = sortMenu.querySelector(
      'button.group-sort-option[data-group="album"][data-sort-by="valueDesc"]'
    ) as HTMLButtonElement;
    expect(currentSort.disabled).toBe(true);
  });
});
