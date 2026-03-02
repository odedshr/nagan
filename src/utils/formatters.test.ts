import { describe, expect, it } from 'vitest';

import { prettyTime } from './formatters.ts';

describe('prettyTime', () => {
  it('formats seconds as mm:ss', () => {
    expect(prettyTime(0)).toBe('00:00');
    expect(prettyTime(5)).toBe('00:05');
    expect(prettyTime(61)).toBe('01:01');
    expect(prettyTime(61.9)).toBe('01:01');
  });
});
