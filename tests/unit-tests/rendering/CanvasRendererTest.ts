import { Constants } from "@/Constants";
import { Frame } from "@/model/Frame";
import { CanvasRenderer } from "@/rendering/CanvasRenderer";
import { FrameUtils } from "@/utils/FrameUtils";
import { frameEqualsGrid, toFrameGrid } from "../testutils/TestUtils";
import { afterEach, beforeEach, describe, it } from "vitest";

describe("Canvas Renderer test", function () {
  const BLACK = "#000000";
  const WHITE = "#ffffff";
  const TRANS = Constants.TRANSPARENT_COLOR;

  beforeEach(function () {});
  afterEach(function () {});

  it("draws transparent as white by default", function () {
    // create frame
    const frame = Frame.fromPixelGrid(
      toFrameGrid([
        [BLACK, TRANS],
        [TRANS, BLACK]
      ])
    );

    const renderer = new CanvasRenderer(frame, 1);
    const canvas = renderer.render();

    const frameFromCanvas = FrameUtils.createFromImage(canvas);

    frameEqualsGrid(frameFromCanvas, [
      [BLACK, WHITE],
      [WHITE, BLACK]
    ]);
  });
});
