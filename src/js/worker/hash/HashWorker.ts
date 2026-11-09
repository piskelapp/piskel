export type HashRequest = { str: string };
export type HashResponse =
  | { type: "SUCCESS"; hash: number }
  | { type: "ERROR"; message: string };

const post = (message: HashResponse): void => {
  self.postMessage(message);
};

const hashCode = (str: string): number => {
  let hash = 0;
  if (str.length !== 0) {
    for (let i = 0, l = str.length; i < l; i++) {
      const chr = str.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
    }
  }
  return hash;
};

self.onmessage = (event: MessageEvent<HashRequest>): void => {
  try {
    post({ type: "SUCCESS", hash: hashCode(event.data.str) });
  } catch (e) {
    post({
      type: "ERROR",
      message: e instanceof Error ? e.message : String(e)
    });
  }
};
