import type { Frame } from "../../../src/js/model/Frame";
import { CanvasUtils } from "../../../src/js/utils/CanvasUtils";
import { assertDefined, colorToInt } from "../../../src/js/utils/core";
import { expect } from "vitest";

export type Color = string | number;
export type Rgba = { r: number; g: number; b: number; a: number };

/**
 * Stand-in for an object of which a test only uses a part, or argument of a
 * type the application code doesn't expect, for tests that check how it fails.
 */
export function mock<T>(partial: unknown): T {
  const holder: object = { value: partial };
  return Reflect.get(holder, "value");
}

/**
 * Frame.createFromGrid accepts grids that are rotated by 90deg from
 * the visual/usual way. (column-based grid)
 *
 * For testing, it's easier for be able to specify a row-based grid, because
 * it visually matches what the image will look like.
 *
 * For instance :
 *
 * [[black, black, black],
 *  [white, white, white]]
 *
 * we expect this to be a 3x2 image, one black line above a white line.
 *
 * However Frame.createFromGrid needs the following input to create such an image :
 *
 * [[black, white],
 *  [black, white],
 *  [black, white]]
 *
 * This helper will build the second array from the first array.
 */
export function toFrameGrid<T>(normalGrid: T[][]): T[][] {
  const frameGrid: T[][] = [];
  const w = normalGrid[0].length;
  const h = normalGrid.length;
  for (let x = 0; x < w; x++) {
    frameGrid[x] = [];
    for (let y = 0; y < h; y++) {
      frameGrid[x][y] = normalGrid[y][x];
    }
  }
  return frameGrid;
}

export function colorEqualsColor(color: Color, expected: Color): void {
  expect(colorToInt(color)).toBe(colorToInt(expected));
}

export function frameEqualsGrid(frame: Frame, grid: Color[][]): void {
  frame.forEachPixel(function (color: number, col: number, row: number) {
    colorEqualsColor(color, grid[row][col]);
  });
}

export function compareColor(colorA: Color, colorB: Color): boolean {
  return colorToInt(colorA) === colorToInt(colorB);
}

export function getRgbaAt(
  image: HTMLImageElement | HTMLCanvasElement,
  x: number,
  y: number
): Rgba {
  const w = image.width;
  const h = image.height;
  const canvas = CanvasUtils.createCanvas(w, h);
  const context = assertDefined(canvas.getContext("2d"), "context");

  context.drawImage(image, 0, 0, w, h, 0, 0, w, h);
  const imageData = context.getImageData(0, 0, w, h).data;
  const i = (y * w + x) * 4;

  return {
    r: imageData[i],
    g: imageData[i + 1],
    b: imageData[i + 2],
    a: imageData[i + 3] / 255
  };
}

export function imageEqualsGrid(
  image: HTMLImageElement | HTMLCanvasElement,
  grid: Color[][]
): void {
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[x].length; y++) {
      const expected = window.tinycolor(String(grid[x][y])).toRgbString();
      const color = window.tinycolor(getRgbaAt(image, x, y)).toRgbString();
      colorEqualsColor(color, expected);
    }
  }
}
