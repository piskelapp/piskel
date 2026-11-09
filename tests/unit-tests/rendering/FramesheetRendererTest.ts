import { Constants } from "../../../src/js/Constants";
import { Frame } from "../../../src/js/model/Frame";
import { FramesheetRenderer } from "../../../src/js/rendering/FramesheetRenderer";
import { FrameUtils } from "../../../src/js/utils/FrameUtils";
import { frameEqualsGrid, toFrameGrid } from "../testutils/TestUtils";
import { afterEach, beforeEach, describe, it } from "vitest";

describe("Framesheet Renderer test", function () {
  const B = "#000000";
  const W = "#ffffff";
  const T = Constants.TRANSPARENT_COLOR;

  beforeEach(function () {});
  afterEach(function () {});

  const toFrame = function (array: (string | number)[][]) {
    return Frame.fromPixelGrid(toFrameGrid(array));
  };

  it("draws frames side by side by default", function () {
    // create frames
    const f1 = toFrame([
      [B, T],
      [B, W]
    ]);
    const f2 = toFrame([
      [W, B],
      [T, B]
    ]);

    const renderer = new FramesheetRenderer([f1, f2]);
    const canvas = renderer.renderAsCanvas();
    frameEqualsGrid(FrameUtils.createFromImage(canvas), [
      [B, T, W, B],
      [B, W, T, B]
    ]);
  });

  it("renderAsCanvas accepts columns argument", function () {
    // create frames
    const f1 = toFrame([[B, B]]);
    const f2 = toFrame([[W, W]]);
    const f3 = toFrame([[T, W]]);
    const f4 = toFrame([[B, W]]);
    const frames = [f1, f2, f3, f4];

    // columns = 4
    let renderer = new FramesheetRenderer(frames);
    let canvas = renderer.renderAsCanvas(4);
    frameEqualsGrid(FrameUtils.createFromImage(canvas), [
      [B, B, W, W, T, W, B, W]
    ]);

    // columns = 3
    renderer = new FramesheetRenderer(frames);
    canvas = renderer.renderAsCanvas(3);
    frameEqualsGrid(FrameUtils.createFromImage(canvas), [
      [B, B, W, W, T, W],
      [B, W, T, T, T, T]
    ]);

    // columns = 2
    renderer = new FramesheetRenderer(frames);
    canvas = renderer.renderAsCanvas(2);
    frameEqualsGrid(FrameUtils.createFromImage(canvas), [
      [B, B, W, W],
      [T, W, B, W]
    ]);

    // columns = 1
    renderer = new FramesheetRenderer(frames);
    canvas = renderer.renderAsCanvas(1);
    frameEqualsGrid(FrameUtils.createFromImage(canvas), [
      [B, B],
      [W, W],
      [T, W],
      [B, W]
    ]);
  });
});
