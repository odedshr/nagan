type StateHelpers<T> = {
  addListener<K extends keyof T>(key: K, fn: (value: T[K]) => void): void;
  computed<K extends string>(key: K, fn: (state: T) => any): void;
  bidi(
    prop: keyof T,
    elm: HTMLElement,
    attribute?: string,
    event?: string
  ): void;
};

export type StateTemplate<T> = T & StateHelpers<T>;

export function Context<T extends object>(initial: T): StateTemplate<T> {
  const listeners = new Map<string, Set<Function>>();
  const computed = new Map();

  const notify = (key:string, value:any) => {
    if (listeners.has(key)) {
      listeners.get(key)?.forEach(fn => fn(value));
    }
  };

  const handler = {
    get(target:any, prop:string, receiver:unknown) {
      if (computed.has(prop)) {
        return computed.get(prop)(receiver); // compute dynamically
      }
      return Reflect.get(target, prop, receiver);
    },
    set(target:any, prop:string, value:any, receiver:unknown) {
      const result = Reflect.set(target, prop, value, receiver);
      notify(prop, value);
      return result;
    },
    delete(target:any, prop:string) {
      const result = Reflect.deleteProperty(target, prop);
        if (computed.has(prop)) {
          computed.delete(prop);
        }
        return result;
      }
    };

  const proxy = new Proxy(initial, handler);

  proxy.addListener = (prop:string, fn:Function) => {
    if (!listeners.has(prop)) {
      listeners.set(prop, new Set());
    }
    listeners.get(prop)?.add(fn);
  };

  proxy.removeListener = (prop:string, fn:Function) => {
    if (listeners.has(prop)) {
      listeners.get(prop)?.delete(fn);
    }
  };

  proxy.compute = (prop:string, fn:Function) => {
    return computed.set(prop, fn);;
  };

  proxy.bidi = (prop:string,
    elm:HTMLElement,
    attribute = 'value',
    event = 'change') => {
      elm.setAttribute(attribute, proxy[prop] || '');
      elm.addEventListener(event, () => {
        proxy[prop] = elm[attribute as keyof HTMLElement];
      });
      
      proxy.addListener(prop, (newValue:string) => {
        if (elm.getAttribute(attribute) !== newValue) {
          //@ts-ignore
          elm[attribute as keyof HTMLElement] = newValue;
        }
      });
  };

  return proxy;
}