type StateHelpers<T> = {
  addListener<K extends keyof T>(key: K, fn: (value: T[K]) => void): void;
  removeListener<K extends keyof T>(key: K, fn: (value: T[K]) => void): void;
  compute<K extends string>(key: K, fn: (state: T) => unknown): void;
  bidi(prop: keyof T, elm: HTMLElement, attribute?: string, event?: string): void;
};

export type StateTemplate<T> = T & StateHelpers<T>;

export function Context<T extends object>(initial: T): StateTemplate<T> {
  const listeners = new Map<string, Set<Function>>();
  const computed = new Map<string, Function>();

  const notify = (key: string, value: string | number | boolean) => {
    if (listeners.has(key)) {
      listeners.get(key)?.forEach(fn => fn(value));
    }
  };

  const handler = {
    get(target: object, prop: string, receiver: unknown) {
      if (computed.has(prop)) {
        const fn = computed.get(prop);
        return fn ? fn(receiver) : undefined; // compute dynamically
      }
      return Reflect.get(target, prop, receiver);
    },
    set(target: object, prop: string, value: string | number | boolean, receiver: unknown) {
      const result = Reflect.set(target, prop, value, receiver);
      notify(prop, value);
      return result;
    },
    deleteProperty(target: object, prop: string) {
      const result = Reflect.deleteProperty(target, prop);
      if (computed.has(prop)) {
        computed.delete(prop);
      }
      return result;
    },
  };

  const proxy = new Proxy(initial, handler) as unknown as StateTemplate<T>;

  proxy.addListener = <K extends keyof T>(prop: K, fn: (value: T[K]) => void) => {
    const key = prop as string;
    if (!listeners.has(key)) {
      listeners.set(key, new Set());
    }
    listeners.get(key)?.add(fn);
  };

  proxy.removeListener = <K extends keyof T>(prop: K, fn: (value: T[K]) => void) => {
    const key = prop as string;
    if (listeners.has(key)) {
      listeners.get(key)?.delete(fn);
    }
  };

  proxy.compute = (prop: string, fn: Function) => {
    return computed.set(prop, fn);
  };

  proxy.bidi = (prop: keyof T, elm: HTMLElement, attribute = 'value', event = 'change') => {
    elm.setAttribute(attribute, (proxy[prop] as string) || '');
    elm.addEventListener(event, () => {
      (proxy as T)[prop] = elm[attribute as keyof HTMLElement] as T[keyof T];
    });

    proxy.addListener(prop, newValue => {
      if (elm.getAttribute(attribute) !== newValue) {
        //@ts-ignore
        elm[attribute as keyof HTMLElement] = newValue;
      }
    });
  };

  return proxy;
}
