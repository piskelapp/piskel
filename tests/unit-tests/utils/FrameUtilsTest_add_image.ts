import { Constants } from "../../../src/js/Constants";
import { Frame } from "../../../src/js/model/Frame";
import { FrameUtils } from "../../../src/js/utils/FrameUtils";
import { frameEqualsGrid, toFrameGrid } from "../testutils/TestUtils";
import { describe, it } from "vitest";

describe("FrameUtils addImageToFrame tests", function () {
  const black = "#000000";
  const red = "#ff0000";
  const transparent = Constants.TRANSPARENT_COLOR;
  const B = black,
    R = red,
    T = transparent;

  // shortcuts

  /**
   * The three helpers below enable using only "visual" grids, while
   * most frame helpers use rotated grids.
   */
  const createFrameFromGrid = function (grid: (string | number)[][]) {
    return Frame.fromPixelGrid(toFrameGrid(grid));
  };

  const createImageFromGrid = function (grid: string[][]) {
    return FrameUtils.toImage(createFrameFromGrid(grid));
  };

  it("adds smaller image at drop position", function () {
    // Transparent frame 2x2
    const frame = createFrameFromGrid([
      [T, T],
      [T, T]
    ]);

    // Single red pixel image
    const image = createImageFromGrid([[R]]);

    FrameUtils.addImageToFrame(frame, image, 0, 0);

    // Verify
    frameEqualsGrid(frame, [
      [R, T],
      [T, T]
    ]);

    FrameUtils.addImageToFrame(frame, image, 1, 1);
    // Verify
    frameEqualsGrid(frame, [
      [R, T],
      [T, R]
    ]);
  });

  it("adds line image at drop position", function () {
    // Transparent frame 2x2
    const frame = createFrameFromGrid([
      [T, T],
      [T, T]
    ]);

    // Line of 2 red pixels
    const image = createImageFromGrid([[R, R]]);

    FrameUtils.addImageToFrame(frame, image, 0, 0);

    // Verify
    frameEqualsGrid(frame, [
      [R, R],
      [T, T]
    ]);

    FrameUtils.addImageToFrame(frame, image, 0, 1);

    // Verify
    frameEqualsGrid(frame, [
      [R, R],
      [R, R]
    ]);
  });

  it("does not erase under transparent areas", function () {
    // Black frame 2x2
    const frame = createFrameFromGrid([
      [B, B],
      [B, B]
    ]);

    // 2x2 image with 3 transparent pixels and a red pixel
    const image = createImageFromGrid([
      [T, T],
      [T, R]
    ]);

    FrameUtils.addImageToFrame(frame, image, 0, 0);

    // Verify
    frameEqualsGrid(frame, [
      [B, B],
      [B, R]
    ]);
  });

  it("offsets drop position", function () {
    // Transparent frame 2x2
    const frame = createFrameFromGrid([
      [T, T],
      [T, T]
    ]);

    // Line of 2 red pixels
    const image = createImageFromGrid([[R, R]]);

    // Drop it on the right side, should be moved back to te left
    FrameUtils.addImageToFrame(frame, image, 1, 0);

    // Verify
    frameEqualsGrid(frame, [
      [R, R],
      [T, T]
    ]);
  });

  it("offsets drop position take 2", function () {
    // Transparent frame 2x2
    const frame = createFrameFromGrid([
      [T, T],
      [T, T]
    ]);

    // 2x2 image
    const image = createImageFromGrid([
      [B, R],
      [R, B]
    ]);

    FrameUtils.addImageToFrame(frame, image, 1, 1);

    // Verify
    frameEqualsGrid(frame, [
      [B, R],
      [R, B]
    ]);
  });
});
