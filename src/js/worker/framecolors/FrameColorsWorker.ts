export type FrameColorsRequest = [
  transparentColor: number,
  maxColors: number,
  frame: Uint32Array
];
export type FrameColorsMap = Record<number, boolean>;
export type FrameColorsResponse =
  | { type: "SUCCESS"; colors: FrameColorsMap }
  | { type: "ERROR"; message: string };

const post = (message: FrameColorsResponse): void => {
  self.postMessage(message);
};

const getFrameColors = (
  frame: Uint32Array,
  transparentColorInt: number,
  maxColors: number
): FrameColorsMap => {
  const frameColors: FrameColorsMap = {};
  let colors = 0;
  for (
    let i = 0, length = frame.length;
    i < length && colors < maxColors;
    i++
  ) {
    const color = frame[i];
    if (color !== transparentColorInt) {
      if (!frameColors[color]) {
        frameColors[color] = true;
        colors++;
      }
    }
  }
  return frameColors;
};

self.onmessage = (event: MessageEvent<FrameColorsRequest>): void => {
  try {
    const [transparentColor, maxColors, frame] = event.data;
    post({
      type: "SUCCESS",
      colors: getFrameColors(frame, transparentColor, maxColors)
    });
  } catch (e) {
    post({
      type: "ERROR",
      message: e instanceof Error ? e.message : String(e)
    });
  }
};
