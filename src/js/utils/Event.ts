export type ListenerCallback = (...args: never[]) => void;

type Listener = {
  el: EventTarget;
  type: string;
  callback: ListenerCallback;
  handler: EventListener;
};

// One list of listeners per scope, for removeAllEventListeners.
const scopes = new WeakMap<object, Listener[]>();

export const EventUtils = {
  addEventListener(
    el: EventTarget | string,
    type: string,
    callback: ListenerCallback,
    scope: object,
    args?: unknown
  ): void {
    const target: EventTarget | null =
      typeof el === "string" ? document.querySelector(el) : el;
    if (target === null) {
      throw new Error("Missing element: " + el);
    }

    const listener: Listener = {
      el: target,
      type: type,
      callback: callback,
      handler: function (event: Event): void {
        Reflect.apply(callback, scope, args ? [args, event] : [event]);
      }
    };

    const listeners = scopes.get(scope) || [];
    scopes.set(scope, listeners);
    listeners.push(listener);
    target.addEventListener(type, listener.handler);
  },

  removeEventListener(
    el: EventTarget,
    type: string,
    callback: ListenerCallback,
    scope: object
  ): void {
    const listeners = scope && scopes.get(scope);
    if (listeners) {
      for (let i = 0; i < listeners.length; i++) {
        const listener = listeners[i];
        if (
          listener.callback === callback &&
          listener.el === el &&
          listener.type === type
        ) {
          el.removeEventListener(type, listeners[i].handler);
          listeners.splice(i, 1);
          break;
        }
      }
    }
  },

  removeAllEventListeners(scope: object): void {
    const listeners = scope && scopes.get(scope);
    if (listeners) {
      for (let i = 0; i < listeners.length; i++) {
        const listener = listeners[i];
        listener.el.removeEventListener(listener.type, listener.handler);
      }
      scopes.set(scope, []);
    }
  }
};
