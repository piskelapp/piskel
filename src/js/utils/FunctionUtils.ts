export const FunctionUtils = {
  /**
   * Returns a memoized version of the provided function.
   */
  memo<A extends unknown[], R>(
    fn: (...args: A) => R,
    cache: Record<string, R>,
    scope?: unknown
  ): (...args: A) => R {
    const memoized = function (...args: A): R {
      const key = args.join("-");
      if (!cache[key]) {
        cache[key] = fn.apply(scope, args);
      }
      return cache[key];
    };
    return memoized;
  },

  /**
   * Returns a throttled version of the provided method, that will be called at most
   * every X milliseconds, where X is the provided interval.
   */
  throttle(fn: () => void, interval: number): () => void {
    let last: number;
    let timer: number | undefined;
    return function () {
      const now = Date.now();
      if (last && now < last + interval) {
        window.clearTimeout(timer);
        timer = window.setTimeout(function () {
          last = now;
          fn();
        }, interval);
      } else {
        last = now;
        fn();
      }
    };
  }
};
