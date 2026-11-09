export type DrawingLoopCallback = {
  fn: (delta: number, args?: unknown) => void;
  scope: unknown;
  args: unknown;
};

type RequestAnimationFrame = (callback: FrameRequestCallback) => number;

export class DrawingLoop {
  requestAnimationFrame: RequestAnimationFrame;
  isRunning: boolean;
  previousTime: number;
  callbacks: DrawingLoopCallback[];

  constructor() {
    this.requestAnimationFrame = this.getRequestAnimationFrameShim_();
    this.isRunning = false;
    this.previousTime = 0;
    this.callbacks = [];
    this.loop_ = this.loop_.bind(this);
  }

  addCallback(
    callback: (delta: number, args?: unknown) => void,
    scope: unknown,
    args?: unknown
  ): DrawingLoopCallback {
    const callbackObj: DrawingLoopCallback = {
      fn: callback,
      scope: scope,
      args: args
    };

    this.callbacks.push(callbackObj);
    return callbackObj;
  }

  removeCallback(callbackObj: DrawingLoopCallback): void {
    const index = this.callbacks.indexOf(callbackObj);
    if (index != -1) {
      this.callbacks.splice(index, 1);
    }
  }

  start(): void {
    this.isRunning = true;
    this.loop_();
  }

  loop_(): void {
    const currentTime = Date.now();
    // The system clock can go backwards (NTP sync, user setting the time manually, resume from sleep...).
    // A negative delta would lead to negative frame indexes in the preview.
    const delta = Math.max(0, currentTime - this.previousTime);
    this.executeCallbacks_(delta);
    this.previousTime = currentTime;
    this.requestAnimationFrame.call(window, this.loop_);
  }

  executeCallbacks_(deltaTime: number): void {
    for (let i = 0; i < this.callbacks.length; i++) {
      const cb = this.callbacks[i];
      cb.fn.call(cb.scope, deltaTime, cb.args);
    }
  }

  stop(): void {
    this.isRunning = false;
  }

  getRequestAnimationFrameShim_(): RequestAnimationFrame {
    const prefixed = window as Window &
      typeof globalThis & {
        mozRequestAnimationFrame?: RequestAnimationFrame;
        webkitRequestAnimationFrame?: RequestAnimationFrame;
        msRequestAnimationFrame?: RequestAnimationFrame;
      };
    const requestAnimationFrame: RequestAnimationFrame =
      prefixed.requestAnimationFrame ||
      prefixed.mozRequestAnimationFrame ||
      prefixed.webkitRequestAnimationFrame ||
      prefixed.msRequestAnimationFrame ||
      function (callback: FrameRequestCallback) {
        return window.setTimeout(callback, 1000 / 60);
      };

    return requestAnimationFrame;
  }
}
