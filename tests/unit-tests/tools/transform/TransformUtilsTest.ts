import { Constants } from "../../../../src/js/Constants";
import { Frame } from "../../../../src/js/model/Frame";
import { TransformUtils } from "../../../../src/js/tools/transform/TransformUtils";
import { frameEqualsGrid, toFrameGrid } from "../../testutils/TestUtils";
import { describe, it } from "vitest";

describe("TransformUtils suite", function () {
  const A = "#000000";
  const B = "#ff0000";
  const O = Constants.TRANSPARENT_COLOR;

  const HORIZONTAL = TransformUtils.HORIZONTAL;
  const VERTICAL = TransformUtils.VERTICAL;

  const CLOCKWISE = TransformUtils.CLOCKWISE;
  const COUNTERCLOCKWISE = TransformUtils.COUNTERCLOCKWISE;

  // shortcuts

  /*******************************/
  /************ FLIP *************/
  /*******************************/

  it("flips a frame vertically", function () {
    // create frame
    const frame = Frame.fromPixelGrid(
      toFrameGrid([
        [A, O],
        [O, B]
      ])
    );

    // should have flipped
    TransformUtils.flip(frame, VERTICAL);
    frameEqualsGrid(frame, [
      [O, A],
      [B, O]
    ]);
  });

  it("flips a frame horizontally", function () {
    // create frame
    const frame = Frame.fromPixelGrid(
      toFrameGrid([
        [A, O],
        [O, B]
      ])
    );

    // should have flipped
    TransformUtils.flip(frame, HORIZONTAL);
    frameEqualsGrid(frame, [
      [O, B],
      [A, O]
    ]);
  });

  it("flips rectangular frame", function () {
    // create frame
    const frame = Frame.fromPixelGrid(
      toFrameGrid([
        [A, O],
        [A, O],
        [A, O]
      ])
    );

    // should have flipped
    TransformUtils.flip(frame, VERTICAL);
    frameEqualsGrid(frame, [
      [O, A],
      [O, A],
      [O, A]
    ]);

    // should be the same
    TransformUtils.flip(frame, HORIZONTAL);
    frameEqualsGrid(frame, [
      [O, A],
      [O, A],
      [O, A]
    ]);
  });

  /*******************************/
  /*********** ROTATE ************/
  /*******************************/

  it("rotates a frame counterclockwise", function () {
    // create frame
    const frame = Frame.fromPixelGrid(
      toFrameGrid([
        [A, O],
        [O, B]
      ])
    );

    // rotate once
    TransformUtils.rotate(frame, COUNTERCLOCKWISE);
    frameEqualsGrid(frame, [
      [O, B],
      [A, O]
    ]);

    // rotate twice
    TransformUtils.rotate(frame, COUNTERCLOCKWISE);
    frameEqualsGrid(frame, [
      [B, O],
      [O, A]
    ]);

    // rotate 3
    TransformUtils.rotate(frame, COUNTERCLOCKWISE);
    frameEqualsGrid(frame, [
      [O, A],
      [B, O]
    ]);

    // rotate 4 - back to initial state
    TransformUtils.rotate(frame, COUNTERCLOCKWISE);
    frameEqualsGrid(frame, [
      [A, O],
      [O, B]
    ]);
  });

  it("rotates a frame clockwise", function () {
    // create frame
    const frame = Frame.fromPixelGrid(
      toFrameGrid([
        [A, O],
        [O, B]
      ])
    );

    // rotate once
    TransformUtils.rotate(frame, CLOCKWISE);
    frameEqualsGrid(frame, [
      [O, A],
      [B, O]
    ]);

    // rotate twice
    TransformUtils.rotate(frame, CLOCKWISE);
    frameEqualsGrid(frame, [
      [B, O],
      [O, A]
    ]);

    // rotate 3
    TransformUtils.rotate(frame, CLOCKWISE);
    frameEqualsGrid(frame, [
      [O, B],
      [A, O]
    ]);

    // rotate 4 - back to initial state
    TransformUtils.rotate(frame, CLOCKWISE);
    frameEqualsGrid(frame, [
      [A, O],
      [O, B]
    ]);
  });

  it("rotates a rectangular frame", function () {
    // create frame
    const frame = Frame.fromPixelGrid(
      toFrameGrid([
        [A, O],
        [A, O],
        [B, O],
        [B, O]
      ])
    );

    // rotate once
    TransformUtils.rotate(frame, CLOCKWISE);
    frameEqualsGrid(frame, [
      [O, O],
      [B, A],
      [O, O],
      [O, O]
    ]);

    // rotate twice
    TransformUtils.rotate(frame, CLOCKWISE);
    frameEqualsGrid(frame, [
      [O, O],
      [O, B],
      [O, A],
      [O, O]
    ]);

    // rotate 3
    TransformUtils.rotate(frame, CLOCKWISE);
    frameEqualsGrid(frame, [
      [O, O],
      [O, O],
      [A, B],
      [O, O]
    ]);

    // rotate 4
    TransformUtils.rotate(frame, CLOCKWISE);
    frameEqualsGrid(frame, [
      [O, O],
      [A, O],
      [B, O],
      [O, O]
    ]);
  });

  it("rotates a rectangular (horizontal) frame", function () {
    // create frame
    const frame = Frame.fromPixelGrid(
      toFrameGrid([
        [O, O, O, O],
        [A, A, B, B]
      ])
    );

    // rotate once
    TransformUtils.rotate(frame, CLOCKWISE);
    frameEqualsGrid(frame, [
      [O, A, O, O],
      [O, B, O, O]
    ]);

    // rotate twice
    TransformUtils.rotate(frame, CLOCKWISE);
    frameEqualsGrid(frame, [
      [O, B, A, O],
      [O, O, O, O]
    ]);

    // rotate 3
    TransformUtils.rotate(frame, CLOCKWISE);
    frameEqualsGrid(frame, [
      [O, O, B, O],
      [O, O, A, O]
    ]);

    // rotate 4
    TransformUtils.rotate(frame, CLOCKWISE);
    frameEqualsGrid(frame, [
      [O, O, O, O],
      [O, A, B, O]
    ]);
  });

  /*******************************/
  /*********** CENTER ************/
  /*******************************/

  it("centers a frame", function () {
    // create frame
    const frame = Frame.fromPixelGrid(
      toFrameGrid([
        [A, B, O, O],
        [B, A, O, O],
        [O, O, O, O],
        [O, O, O, O]
      ])
    );

    // should be centered
    TransformUtils.center(frame);
    frameEqualsGrid(frame, [
      [O, O, O, O],
      [O, A, B, O],
      [O, B, A, O],
      [O, O, O, O]
    ]);
  });
});
