export type ImageProcessorRequest = {
  imageData: Uint8ClampedArray;
  width: number;
  height: number;
};
export type ColorsMap = Record<string, boolean>;
export type ImageProcessorResponse =
  | {
      type: "STEP";
      progress: string;
      currentStep: number;
      total: number;
    }
  | { type: "SUCCESS"; colorsMap: ColorsMap }
  | { type: "ERROR"; message: string };

const post = (message: ImageProcessorResponse): void => {
  self.postMessage(message);
};

let currentStep = 0;
let currentProgress = "";
let currentTotal = 0;

const initStepCounter_ = (total: number): void => {
  currentStep = 0;
  currentProgress = "0";
  currentTotal = total;
};

const postStep_ = (): void => {
  currentStep = currentStep + 1;
  const progress = ((currentStep / currentTotal) * 100).toFixed(1);
  if (progress !== currentProgress) {
    currentProgress = progress;
    post({
      type: "STEP",
      progress: currentProgress,
      currentStep: currentStep,
      total: currentTotal
    });
  }
};

const componentToHex = (c: number): string => {
  const hex = c.toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
};

const rgbToHex = (r: number, g: number, b: number): string =>
  `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;

const imageDataToGrid = (
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  transparent: string
): string[][] => {
  // Draw the zoomed-up pixels to a different canvas context
  const grid: string[][] = [];
  for (let x = 0; x < width; x++) {
    grid[x] = [];
    postStep_();
    for (let y = 0; y < height; y++) {
      // Find the starting index in the one-dimensional image data
      const i = (y * width + x) * 4;
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      const a = imageData[i + 3];
      if (a < 125) {
        grid[x][y] = transparent;
      } else {
        grid[x][y] = rgbToHex(r, g, b);
      }
    }
  }
  return grid;
};

const getColorsMapFromImageData = (
  imageData: Uint8ClampedArray,
  width: number,
  height: number
): ColorsMap => {
  const grid = imageDataToGrid(imageData, width, height, "transparent");

  const colorsMap: ColorsMap = {};
  for (let i = 0; i < grid.length; i++) {
    postStep_();
    for (let j = 0; j < grid[i].length; j++) {
      const color = grid[i][j];
      if (color !== "transparent") {
        colorsMap[color] = true;
      }
    }
  }
  return colorsMap;
};

self.onmessage = (event: MessageEvent<ImageProcessorRequest>): void => {
  try {
    const data = event.data;

    initStepCounter_(data.width * 2);

    const colorsMap = getColorsMapFromImageData(
      data.imageData,
      data.width,
      data.height
    );

    post({ type: "SUCCESS", colorsMap: colorsMap });
  } catch (e) {
    post({
      type: "ERROR",
      message: e instanceof Error ? e.message : String(e)
    });
  }
};
