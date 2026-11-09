import { Constants } from "../../../src/js/Constants";
import { Frame } from "../../../src/js/model/Frame";
import { FrameUtils } from "../../../src/js/utils/FrameUtils";
import { assertDefined } from "../../../src/js/utils/core";
import { frameEqualsGrid, mock, toFrameGrid } from "../testutils/TestUtils";
import { describe, expect, it } from "vitest";

describe("FrameUtils suite", function () {
  const black = "#000000";
  const red = "#ff0000";
  const transparent = Constants.TRANSPARENT_COLOR;

  // shortcuts

  it("merges 2 frames", function () {
    const B = black,
      R = red,
      T = transparent;
    const frame1 = Frame.fromPixelGrid([
      [B, T],
      [T, B]
    ]);

    const frame2 = Frame.fromPixelGrid([
      [T, R],
      [R, T]
    ]);

    const mergedFrame = FrameUtils.merge([frame1, frame2]);
    frameEqualsGrid(assertDefined(mergedFrame, "mergedFrame"), [
      [B, R],
      [R, B]
    ]);
  });

  it("returns same frame when merging single frame", function () {
    const B = black,
      T = transparent;
    const frame1 = Frame.fromPixelGrid(
      toFrameGrid([
        [B, T],
        [B, T]
      ])
    );

    const mergedFrame = FrameUtils.merge([frame1]);
    frameEqualsGrid(assertDefined(mergedFrame, "mergedFrame"), [
      [B, T],
      [B, T]
    ]);
  });

  const checkPixelsColor = function (
    frame: Frame,
    pixels: number[][],
    color: string
  ) {
    pixels.forEach(function (pixel: number[]) {
      const pixelColor = frame.getPixel(pixel[0], pixel[1]);
      expect(pixelColor).toBe(color);
    });
  };

  it("converts an image to a frame", function () {
    const B = black,
      T = transparent;
    const frame1 = Frame.fromPixelGrid([
      [B, T],
      [T, B]
    ]);

    const image = FrameUtils.toImage(frame1);
    expect(image.width).toBe(2);
    expect(image.height).toBe(2);

    const biggerImage = FrameUtils.toImage(frame1, 3);
    expect(biggerImage.width).toBe(6);
    expect(biggerImage.height).toBe(6);

    const biggerFrame = FrameUtils.createFromImage(biggerImage);

    frameEqualsGrid(biggerFrame, [
      [B, B, B, T, T, T],
      [B, B, B, T, T, T],
      [B, B, B, T, T, T],
      [T, T, T, B, B, B],
      [T, T, T, B, B, B],
      [T, T, T, B, B, B]
    ]);
  });

  it("[LayerUtils] creates frames from a simple spritesheet", function () {
    const B = black,
      R = red;

    // original image in 4x2
    const frame = Frame.fromPixelGrid(
      toFrameGrid([
        [B, R, B, R],
        [R, B, B, R]
      ])
    );

    const spritesheet = FrameUtils.toImage(frame);

    // split the spritesheet by 4
    const frames = FrameUtils.createFramesFromSpritesheet(spritesheet, 4);

    // expect 4 frames of 1x2
    expect(frames.length).toBe(4);

    // verify frame content
    frameEqualsGrid(frames[0], [[B], [R]]);
    frameEqualsGrid(frames[1], [[R], [B]]);
    frameEqualsGrid(frames[2], [[B], [B]]);
    frameEqualsGrid(frames[3], [[R], [R]]);
  });

  it("supports null values in frame array", function () {
    const B = black,
      T = transparent;
    const frame = Frame.fromPixelGrid([
      [B, mock<string>(null)],
      [mock<string>(null), B]
    ]);

    const image = FrameUtils.toImage(frame);

    // transform back to frame for ease of testing
    const testFrame = FrameUtils.createFromImage(image);
    frameEqualsGrid(testFrame, [
      [B, T],
      [T, B]
    ]);
  });
});
