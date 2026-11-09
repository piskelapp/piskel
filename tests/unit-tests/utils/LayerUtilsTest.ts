import { Constants } from "../../../src/js/Constants";
import { Frame } from "../../../src/js/model/Frame";
import { Layer } from "../../../src/js/model/Layer";
import { LayerUtils } from "../../../src/js/utils/LayerUtils";
import { frameEqualsGrid, imageEqualsGrid } from "../testutils/TestUtils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("LayerUtils test", function () {
  const B = "#000000";
  const R = "#ff0000";
  const T = Constants.TRANSPARENT_COLOR;

  const frame1 = Frame.fromPixelGrid([
    [B, T],
    [T, B]
  ]);

  const frame2 = Frame.fromPixelGrid([
    [T, R],
    [R, T]
  ]);

  beforeEach(function () {});
  afterEach(function () {});

  it("flattens a frame", function () {
    // when
    const l1 = new Layer("l1");
    l1.addFrame(frame1);
    const l2 = new Layer("l2");
    l2.addFrame(frame2);

    // then
    const flattened = LayerUtils.flattenFrameAt([l1, l2], 0, false);

    //verify
    imageEqualsGrid(flattened, [
      [B, R],
      [R, B]
    ]);
  });

  it("flattens a frame with opacity", function () {
    // when
    const l1 = new Layer("l1");
    l1.addFrame(frame1);
    const l2 = new Layer("l2");
    l2.setOpacity(0.5);
    l2.addFrame(frame2);

    // then
    const flattened = LayerUtils.flattenFrameAt([l1, l2], 0, true);

    //verify
    imageEqualsGrid(flattened, [
      [B, "rgba(255,0,0,0.5)"],
      ["rgba(255,0,0,0.5)", B]
    ]);
  });

  it("clones a layer", function () {
    const grid1 = [
      [B, T],
      [T, B]
    ];

    const grid2 = [
      [R, B],
      [B, R]
    ];

    // when
    const layer = new Layer("l1");
    layer.addFrame(Frame.fromPixelGrid(grid1));
    layer.addFrame(Frame.fromPixelGrid(grid2));

    // then
    const clone = LayerUtils.clone(layer);
    const clonedFrame = clone.getFrameAt(0);

    // verify
    frameEqualsGrid(clone.getFrameAt(0), grid1);
    frameEqualsGrid(clone.getFrameAt(1), grid2);
    expect(clone.getName()).toBe("l1 (clone)");
  });
});
