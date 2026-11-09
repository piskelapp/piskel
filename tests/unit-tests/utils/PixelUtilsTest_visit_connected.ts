import { Constants } from "../../../src/js/Constants";
import { Frame } from "../../../src/js/model/Frame";
import { type PixelCoords, PixelUtils } from "../../../src/js/utils/PixelUtils";
import { toFrameGrid } from "../testutils/TestUtils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("PixelUtils visitor methods tests", function () {
  const black = "#000000";
  const red = "#ff0000";
  const transparent = Constants.TRANSPARENT_COLOR;
  const B = black,
    R = red,
    T = transparent;

  beforeEach(function () {});
  afterEach(function () {});

  const containsPixel = function (
    pixels: PixelCoords[],
    col: number,
    row: number
  ) {
    return pixels.some(function (p: PixelCoords) {
      return p.col === col && p.row === row;
    });
  };

  it("getSimilarConnectedPixelsFromFrame works", function () {
    const frame = Frame.fromPixelGrid(
      toFrameGrid([
        [T, T, B],
        [B, T, B],
        [T, T, B]
      ])
    );

    let pixels = PixelUtils.getSimilarConnectedPixelsFromFrame(frame, 0, 0);
    expect(pixels.length).toBe(5);
    expect(containsPixel(pixels, 0, 0)).toBe(true);
    expect(containsPixel(pixels, 1, 0)).toBe(true);
    expect(containsPixel(pixels, 1, 1)).toBe(true);
    expect(containsPixel(pixels, 0, 2)).toBe(true);
    expect(containsPixel(pixels, 1, 2)).toBe(true);

    pixels = PixelUtils.getSimilarConnectedPixelsFromFrame(frame, -1, -1);
    expect(Array.isArray(pixels)).toBe(true);
    expect(pixels.length).toBe(0);

    pixels = PixelUtils.getSimilarConnectedPixelsFromFrame(frame, 0, 1);
    expect(pixels.length).toBe(1);
    expect(containsPixel(pixels, 0, 1)).toBe(true);

    pixels = PixelUtils.getSimilarConnectedPixelsFromFrame(frame, 2, 1);
    expect(pixels.length).toBe(3);
    expect(containsPixel(pixels, 2, 0)).toBe(true);
    expect(containsPixel(pixels, 2, 1)).toBe(true);
    expect(containsPixel(pixels, 2, 2)).toBe(true);
  });
});
