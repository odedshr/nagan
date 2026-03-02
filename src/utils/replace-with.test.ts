import { describe, expect, it } from 'vitest';

import replaceWith from './replace-with.ts';

describe('replace-with', () => {
  it('replaces old element in the DOM and returns the new element', () => {
    const oldDiv = document.createElement('div');
    oldDiv.id = 'old';
    const newDiv = document.createElement('div');
    newDiv.id = 'new';

    document.body.appendChild(oldDiv);
    const returned = replaceWith(oldDiv, newDiv);

    expect(returned).toBe(newDiv);
    expect(document.getElementById('old')).toBeNull();
    expect(document.getElementById('new')).toBe(newDiv);
  });
});
