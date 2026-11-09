import { Constants } from "../../../src/js/Constants";
import type { PublicPiskelController } from "../../../src/js/controller/piskel/PublicPiskelController";
import { Frame } from "../../../src/js/model/Frame";
import { OnionSkinRenderer } from "../../../src/js/rendering/OnionSkinRenderer";
import type { FrameRenderer } from "../../../src/js/rendering/frame/FrameRenderer";
import { frameEqualsGrid, mock, toFrameGrid } from "../testutils/TestUtils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

type ReturnedLayer = { frames: Frame[]; getFrameAt(index: number): Frame };

describe("Onion Skin Renderer test", function () {
  const BLACK = "#000000";
  const WHITE = "#ffffff";
  const TRANS = Constants.TRANSPARENT_COLOR;

  beforeEach(function () {});
  afterEach(function () {});

  it("renders correctly :)", function () {
    const fakeRenderer = createMockRenderer();
    const layer = createMockLayer();
    const piskelController = createMockPiskelController();
    piskelController.currentLayer_ = layer;

    const onionSkinRenderer = new OnionSkinRenderer(
      mock<FrameRenderer>(fakeRenderer),
      mock<PublicPiskelController>(piskelController)
    );
    // create frame
    const previousFrame = Frame.fromPixelGrid(
      toFrameGrid([
        [BLACK, TRANS],
        [TRANS, TRANS]
      ])
    );

    const nextFrame = Frame.fromPixelGrid(
      toFrameGrid([
        [TRANS, TRANS],
        [TRANS, BLACK]
      ])
    );

    piskelController.currentFrameIndex_ = 1;
    layer.frames = mock<Frame[]>([previousFrame, {}, nextFrame]);

    // initial state, all counters at 0
    expect(fakeRenderer.clearCounter_).toBe(0);
    expect(fakeRenderer.renderCounter_).toBe(0);

    // First rendering, should call clear + render
    onionSkinRenderer.render();
    expect(fakeRenderer.clearCounter_).toBe(1);
    expect(fakeRenderer.renderCounter_).toBe(1);
    frameEqualsGrid(fakeRenderer.renderedFrame_, [
      [BLACK, TRANS],
      [TRANS, BLACK]
    ]);

    // Second rendering, nothing changed, should not clear or render
    onionSkinRenderer.render();
    expect(fakeRenderer.clearCounter_).toBe(1);
    expect(fakeRenderer.renderCounter_).toBe(1);

    // remove one frame
    layer.frames = mock<Frame[]>([previousFrame, {}]);
    onionSkinRenderer.render();
    expect(fakeRenderer.clearCounter_).toBe(2);
    expect(fakeRenderer.renderCounter_).toBe(2);
    frameEqualsGrid(fakeRenderer.renderedFrame_, [
      [BLACK, TRANS],
      [TRANS, TRANS]
    ]);

    // remove the other frame
    layer.frames = mock<Frame[]>([{}]);
    piskelController.currentFrameIndex_ = 0;
    onionSkinRenderer.render();
    // nothing to render, but the underlying renderer should still be cleared
    expect(fakeRenderer.clearCounter_).toBe(3);
    expect(fakeRenderer.renderCounter_).toBe(2);
  });

  const createMockLayer = function () {
    return {
      frames: mock<Frame[]>([]),
      getFrameAt: function (index: number) {
        return this.frames[index];
      }
    };
  };

  const createMockPiskelController = function () {
    return {
      currentFrameIndex_: 1,
      currentLayer_: mock<ReturnedLayer | null>(null),
      getLayers: function () {
        return [this.currentLayer_];
      },

      getCurrentFrameIndex: function () {
        return this.currentFrameIndex_;
      },

      getCurrentLayer: function () {
        return this.currentLayer_;
      }
    };
  };

  const createMockRenderer = function () {
    return {
      clearCounter_: 0,
      clear: function () {
        this.clearCounter_++;
      },
      renderedFrame_: mock<Frame>(null),
      renderCounter_: 0,
      render: function (frame: Frame) {
        this.renderCounter_++;
        this.renderedFrame_ = frame;
      },
      getZoom: function () {
        return 1;
      },
      getGridWidth: function () {
        return 0;
      },
      getOffset: function () {
        return { x: 0, y: 0 };
      },
      getDisplaySize: function () {
        return { width: 10, height: 10 };
      }
    };
  };
});
