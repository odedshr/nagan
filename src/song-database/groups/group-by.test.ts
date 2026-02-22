import { describe, expect, it } from 'vitest';

import GroupBy from './GroupBy.tsx';

describe('GroupBy', () => {
  it('renders dropdown with None selected when current is undefined', () => {
    const elm = GroupBy(undefined);

    expect(elm.classList.contains('group-by-dropdown')).toBe(true);

    const button = elm.querySelector('#group-by-button') as HTMLButtonElement;
    expect(button).toBeTruthy();
    expect(button.classList.contains('group-by-button')).toBe(true);
    expect(button.textContent).toContain('Group by:');
    expect(button.textContent).toContain('None');

    const menu = elm.querySelector('ul.group-by-menu')!;
    const items = menu.querySelectorAll('li.group-by-item');
    expect(items.length).toBe(1 + 5);

    const noneButton = menu.querySelector('button.group-by-option[data-action="group-by-option"]') as HTMLButtonElement;
    expect(noneButton).toBeTruthy();
    expect(noneButton.disabled).toBe(true);
  });

  it('disables current group-by option and enables None when current set', () => {
    const elm = GroupBy(['album']);

    const menu = elm.querySelector('ul.group-by-menu')!;

    const noneButton = menu.querySelector('button.group-by-option:not([data-group-by])') as HTMLButtonElement;
    expect(noneButton.disabled).toBe(false);

    const albumButton = menu.querySelector('button.group-by-option[data-group-by="album"]') as HTMLButtonElement;
    const artistsButton = menu.querySelector('button.group-by-option[data-group-by="artists"]') as HTMLButtonElement;

    expect(albumButton.disabled).toBe(true);
    expect(artistsButton.disabled).toBe(false);
  });

  it('disables both options when primary + secondary selected', () => {
    const elm = GroupBy(['album', 'artists']);

    const menu = elm.querySelector('ul.group-by-menu')!;
    const albumButton = menu.querySelector('button.group-by-option[data-group-by="album"]') as HTMLButtonElement;
    const artistsButton = menu.querySelector('button.group-by-option[data-group-by="artists"]') as HTMLButtonElement;

    expect(albumButton.disabled).toBe(true);
    expect(artistsButton.disabled).toBe(true);
  });
});
