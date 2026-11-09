import { Constants } from "../../../src/js/Constants";
import { Frame } from "../../../src/js/model/Frame";
import { CanvasRenderer } from "../../../src/js/rendering/CanvasRenderer";
import { FrameUtils } from "../../../src/js/utils/FrameUtils";
import { assertDefined } from "../../../src/js/utils/core";
import { colorEqualsColor, toFrameGrid } from "../testutils/TestUtils";
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

    colorEqualsColor(
      assertDefined(frameFromCanvas.getPixel(0, 0), "pixel"),
      BLACK
    );
    colorEqualsColor(
      assertDefined(frameFromCanvas.getPixel(0, 1), "pixel"),
      WHITE
    );
    colorEqualsColor(
      assertDefined(frameFromCanvas.getPixel(1, 0), "pixel"),
      WHITE
    );
    colorEqualsColor(
      assertDefined(frameFromCanvas.getPixel(1, 1), "pixel"),
      BLACK
    );
  });
});
