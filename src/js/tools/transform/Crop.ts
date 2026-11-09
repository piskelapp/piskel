import { Events } from "../../Events";
import { app } from "../../app";
import type { Frame } from "../../model/Frame";
import { ResizeUtils } from "../../utils/ResizeUtils";
import type { TooltipDescriptor } from "../../utils/TooltipFormatter";
import { assertDefined } from "../../utils/core";
import { Tool } from "../Tool";
import { type Boundaries, TransformUtils } from "./TransformUtils";

export class Crop extends Tool {
  tooltipDescriptors: TooltipDescriptor[];

  constructor() {
    super();
    this.toolId = "tool-crop";
    this.helpText = "Crop the sprite";
    this.tooltipDescriptors = [
      {
        description:
          "Crop to fit the content or the selection. " +
          "Applies to all frames and layers!"
      }
    ];
  }

  applyTransformation(evt: Event): void {
    const frames = this.getFrames_();

    let boundaries;
    if (
      assertDefined(app.selectionManager, "selectionManager").currentSelection
    ) {
      // If we have a selection, we will compute the boundaries of the selection instead
      // of looping on the frames.
      boundaries = this.getBoundariesForSelection_();
    } else {
      boundaries = TransformUtils.getBoundaries(frames);
    }

    const applied = this.applyTool_(frames, boundaries);
    if (applied) {
      this.raiseSaveStateEvent({
        boundaries: boundaries
      });
    }
  }

  replay(frame: Frame, replayData: { boundaries: Boundaries }): void {
    const frames = this.getFrames_();
    this.applyTool_(frames, replayData.boundaries);
  }

  applyTool_(frames: Frame[], boundaries: Boundaries): boolean {
    if (boundaries.minx >= boundaries.maxx) {
      return false;
    }

    const currentPiskel = assertDefined(
      app.piskelController,
      "piskelController"
    ).getPiskel();
    const width = 1 + boundaries.maxx - boundaries.minx;
    const height = 1 + boundaries.maxy - boundaries.miny;

    if (
      width === currentPiskel.getWidth() &&
      height === currentPiskel.getHeight()
    ) {
      // Do not perform an unnecessary resize if it's a noop.
      return false;
    }

    frames.forEach(function (frame: Frame) {
      TransformUtils.moveFramePixels(frame, -boundaries.minx, -boundaries.miny);
    });

    const piskel = ResizeUtils.resizePiskel(currentPiskel, {
      width: 1 + boundaries.maxx - boundaries.minx,
      height: 1 + boundaries.maxy - boundaries.miny,
      origin: "TOP-LEFT",
      resizeContent: false
    });

    // Clear the current selection.
    $.publish(Events.SELECTION_DISMISSED);

    // Replace the current piskel with the resized version.
    assertDefined(app.piskelController, "piskelController").setPiskel(piskel, {
      preserveState: true,
      // Saving is already handled by recording the transform tool action, no need for
      // an expensive snapshot.
      noSnapshot: true
    });

    return true;
  }

  /**
   * Retrieve the list of frames for the current piskel in a single flat array.
   */
  getFrames_(): Frame[] {
    const currentPiskel = assertDefined(
      app.piskelController,
      "piskelController"
    ).getPiskel();

    // Get all frames in a single array.
    const frames = currentPiskel
      .getLayers()
      .map(function (l) {
        return l.getFrames();
      })
      .reduce(function (p, n) {
        return p.concat(n);
      });

    return frames;
  }

  /**
   * Retrieve a boundaries object {minx, maxx, miny, maxy} for the current selection.
   */
  getBoundariesForSelection_(): Boundaries {
    const selectionManager = assertDefined(
      app.selectionManager,
      "selectionManager"
    );
    const pixels = assertDefined(
      assertDefined(selectionManager.currentSelection, "currentSelection")
        .pixels,
      "pixels"
    );

    // Fetch the first frame to perform out-of-bound checks.
    const currentPiskel = assertDefined(
      app.piskelController,
      "piskelController"
    ).getPiskel();
    const exampleFrame = currentPiskel.getLayerAt(0).getFrameAt(0);

    // Anything different from Constants.TRANSPARENT_COLOR toInt().
    const FAKE_COLOR = 1;
    // Create a fake frame reimplementing the forEachPixel API.
    const selectionFrame = {
      forEachPixel: function (
        callback: (color: number, col: number, row: number) => void
      ): void {
        for (let i = 0; i < pixels.length; i++) {
          const pixel = pixels[i];
          // Selections might contain out of bound pixels, filter those out.
          if (exampleFrame.containsPixel(pixel.col, pixel.row)) {
            callback(FAKE_COLOR, pixel.col, pixel.row);
          }
        }
      }
    };

    return TransformUtils.getBoundaries([selectionFrame]);
  }
}
