const s4 = function () {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
};

export const Uuid = {
  /**
   * Returns a random id shaped like a UUID (8-4-4-4-12 hex digits). It isn't
   * a real RFC 9562 UUID: it has no version or variant bits, and it uses
   * Math.random(), which isn't a secure random source.
   *
   * Only use it for non-critical ids that stay in the user's browser, such as palette,
   * session or history ids, where a collision would do no serious harm. Don't
   * use it for ids stored on a server for instance.
   *
   * NOTE: crypto.randomUUID() could replace it without adding a dependency, but it
   * only returns v4 UUIDs, which aren't time-ordered. UUID v7 would also sort
   * the ids by creation time, but browsers don't provide it.
   */
  generate(): string {
    return "ss-s-s-s-sss".replace(/s/g, function () {
      return s4();
    });
  }
};
