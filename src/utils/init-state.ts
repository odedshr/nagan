type StateHelpers<T> = {
  addListener<K extends keyof T>(key: K, fn: (value: T[K]) => void): void;
  addListener(key: '*', fn: (payload: { key: string; value: unknown }) => void): void;
  removeListener<K extends keyof T>(key: K, fn: (value: T[K]) => void): void;
  removeListener(key: '*', fn: (payload: { key: string; value: unknown }) => void): void;
  compute<K extends string>(key: K, fn: (state: T) => unknown): void;
  bidi(
    prop: keyof T,
    elm?: HTMLElement,
    attribute?: string,
    event?: string
  ): void | ((elm: HTMLElement, attribute?: string, event?: string) => void);
  touch<K extends keyof T>(prop: K): void;
  subState<K extends keyof T>(prop: K): StateTemplate<Extract<T[K], object>>;
  lock(prop: string): void;
  unlock(prop: string): void;
};

export type StateTemplate<T> = T & StateHelpers<T>;

export function initState<T extends object>(initial: T): StateTemplate<T> {
  const listeners = new Map<string, Set<Function>>();
  const computed = new Map<string, Function>();
  const locked = new Set<string>();
  const subStateBubblers = new Map<string, (payload: { key: string; value: unknown }) => void>();

  const notify = (key: string, value: unknown) => {
    listeners.get(key)?.forEach(fn => fn(value));
    listeners.get('*')?.forEach(fn => fn({ key, value }));
  };

  const handler = {
    get(target: object, prop: string, receiver: unknown) {
      if (computed.has(prop)) {
        const fn = computed.get(prop);
        return fn ? fn(receiver) : undefined; // compute dynamically
      }
      return Reflect.get(target, prop, receiver);
    },
    set(target: object, prop: string, value: unknown, receiver: unknown) {
      if (locked.has(prop)) {
        throw new TypeError(`Cannot set locked property "${prop}"`);
      }
      const result = Reflect.set(target, prop, value, receiver);
      notify(prop, value);
      return result;
    },
    deleteProperty(target: object, prop: string) {
      if (locked.has(prop)) {
        throw new TypeError(`Cannot delete locked property "${prop}"`);
      }
      const result = Reflect.deleteProperty(target, prop);
      if (computed.has(prop)) {
        computed.delete(prop);
      }
      return result;
    },
    defineProperty(target: object, prop: string, attributes: PropertyDescriptor) {
      if (locked.has(prop)) {
        throw new TypeError(`Cannot define locked property "${prop}"`);
      }
      return Reflect.defineProperty(target, prop, attributes);
    },
  };

  const proxy = new Proxy(initial, handler) as unknown as StateTemplate<T>;

  proxy.addListener = ((prop: string, fn: Function) => {
    if (!listeners.has(prop)) {
      listeners.set(prop, new Set());
    }
    listeners.get(prop)?.add(fn);
  }) as typeof proxy.addListener;

  proxy.removeListener = ((prop: string, fn: Function) => {
    if (listeners.has(prop)) {
      listeners.get(prop)?.delete(fn);
    }
  }) as typeof proxy.removeListener;

  proxy.compute = (prop: string, fn: Function) => {
    return computed.set(prop, fn);
  };

  proxy.bidi = (prop: keyof T, elm?: HTMLElement, attribute = 'value', event = 'change') => {
    if (!elm) {
      return (elm: HTMLElement, attribute = 'value', event = 'change') => proxy.bidi(prop, elm, attribute, event);
    }
    elm.setAttribute(attribute, (proxy[prop] as string) || '');
    elm.addEventListener(event, () => {
      const value = elm[attribute as keyof HTMLElement] as T[keyof T];
      (proxy as T)[prop] = (isNaN((proxy as T)[prop] as unknown as number) ? value : +value) as unknown as T[keyof T];
    });

    proxy.addListener(prop, newValue => {
      if (elm.getAttribute(attribute) !== newValue) {
        if (elm.tagName === 'SELECT' && attribute === 'value') {
          const selectElm = elm as HTMLSelectElement;
          selectElm.selectedIndex = [...selectElm.options].findIndex(option => option.value === newValue);
        } else {
          //@ts-ignore
          elm[attribute as keyof HTMLElement] = newValue;
        }
      }
    });
  };

  proxy.touch = <K extends keyof T>(prop: K) => notify(prop as string, proxy[prop]);
  proxy.lock = (prop: string) => locked.add(prop);
  proxy.unlock = (prop: string) => locked.delete(prop);

  proxy.subState = <K extends keyof T>(prop: K): StateTemplate<Extract<T[K], object>> => {
    const current = proxy[prop] as unknown;
    if (current === null || typeof current !== 'object') {
      throw new TypeError(`subState("${String(prop)}") expects an object value`);
    }

    const maybeState = current as { addListener?: unknown };
    const child = (typeof maybeState.addListener === 'function' ? current : initState(current)) as StateTemplate<
      Extract<T[K], object>
    >;

    if (child !== current) {
      // Replace the nested value without triggering parent listeners.
      (initial as unknown as Record<string, unknown>)[prop as string] = child;
    }

    // Ensure bubbling is idempotent (no duplicate listeners if subState() is called again).
    const propKey = prop as string;
    const existingBubbler = subStateBubblers.get(propKey);
    const bubbler = existingBubbler ?? (() => proxy.touch(prop));
    subStateBubblers.set(propKey, bubbler);
    if (!existingBubbler) {
      child.addListener('*', bubbler);
    }

    // Lock after wrapping so callers can't overwrite the whole sub-state.
    proxy.lock(propKey);
    return child;
  };

  return proxy;
}
