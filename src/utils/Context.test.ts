import { describe, expect, it, vi } from 'vitest';

import { Context } from './Context';

describe('Context', () => {
  it('notifies listeners on property set', () => {
    const state = Context({ mode: 'a' as string, count: 0 as number });

    const onMode = vi.fn();
    state.addListener('mode', onMode);

    state.mode = 'b';
    state.mode = 'c';

    expect(onMode).toHaveBeenCalledTimes(2);
    expect(onMode).toHaveBeenNthCalledWith(1, 'b');
    expect(onMode).toHaveBeenNthCalledWith(2, 'c');
  });

  it('removeListener stops notifications', () => {
    const state = Context({ mode: 'a' as string });

    const onMode = vi.fn();
    state.addListener('mode', onMode);
    state.removeListener('mode', onMode);

    state.mode = 'b';

    expect(onMode).not.toHaveBeenCalled();
  });

  it('compute returns derived values dynamically', () => {
    type BaseState = { a: number; b: number; sum?: number };
    const state = Context<BaseState>({ a: 2, b: 3 });

    state.compute('sum', s => s.a + s.b);

    expect(state.sum).toBe(5);

    state.a = 10;
    expect(state.sum).toBe(13);
  });

  it('deleteProperty clears a computed property', () => {
    type BaseState = { a: number; b: number; sum?: number };
    const state = Context<BaseState>({ a: 1, b: 2 });

    state.compute('sum', s => s.a + s.b);
    expect(state.sum).toBe(3);

    // Deleting the computed key should remove it from the computed map.
    // After deletion, reading the property should fall back to the target (undefined).
    delete state.sum;

    expect(state.sum).toBeUndefined();
  });

  it('bidi sets initial attribute, updates state on event, and updates element on state change', () => {
    const state = Context({ name: 'Alice' as string });

    const input = document.createElement('input');
    state.bidi('name', input);

    expect(input.getAttribute('value')).toBe('Alice');

    // Element -> state
    input.value = 'Bob';
    input.dispatchEvent(new Event('change'));
    expect(state.name).toBe('Bob');

    // State -> element
    state.name = 'Carol';
    expect(input.value).toBe('Carol');
  });

  it('bidi supports custom attribute and event', () => {
    const state = Context({ enabled: false as boolean });

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';

    state.bidi('enabled', checkbox, 'checked', 'input');

    expect(checkbox.getAttribute('checked')).toBe('');

    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('input'));
    expect(state.enabled).toBe(true);

    state.enabled = false;
    expect(checkbox.checked).toBe(false);
  });
});
