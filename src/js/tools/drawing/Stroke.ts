import { Constants } from "../../Constants";
import { app } from "../../app";
import type { Frame } from "../../model/Frame";
import type { Shortcut } from "../../service/keyboard/Shortcut";
import { Shortcuts } from "../../service/keyboard/Shortcuts";
import { PixelUtils } from "../../utils/PixelUtils";
import type { TooltipDescriptor } from "../../utils/TooltipFormatter";
import { assertDefined } from "../../utils/core";
import { BaseTool } from "./BaseTool";

export class Stroke extends BaseTool {
  shortcut: Shortcut;
  tooltipDescriptors: TooltipDescriptor[];
  startCol: number | null;
  startRow: number | null;

  constructor() {
    super();
    this.toolId = "tool-stroke";
    this.helpText = "Stroke tool";
    this.shortcut = Shortcuts.TOOL.STROKE;
    this.tooltipDescriptors = [
      { key: "shift", description: "Hold shift to draw straight lines" }
    ];

    // Stroke's first point coordinates (set in applyToolAt)
    this.startCol = null;
    this.startRow = null;
  }

  supportsDynamicPenSize() {
    return true;
  }

  /**
   * @override
   */
  applyToolAt(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame,
    event: MouseEvent
  ): void {
    this.startCol = col;
    this.startRow = row;

    // When drawing a stroke we don't change the model instantly, since the
    // user can move his cursor to change the stroke direction and length
    // dynamically. Instead we draw the (preview) stroke in a fake canvas that
    // overlay the drawing canvas.
    // We wait for the releaseToolAt callback to impact both the
    // frame model and canvas rendering.

    // The fake canvas where we will draw the preview of the stroke:
    // Drawing the first point of the stroke in the fake overlay canvas:
    overlay.setPixel(col, row, this.getToolColor());
  }

  moveToolAt(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame,
    event: MouseEvent
  ): void {
    overlay.clear();

    const penSize = assertDefined(
      app.penSizeService,
      "penSizeService"
    ).getPenSize();
    const isStraight = event.shiftKey;
    let color = this.getToolColor();
    if (color == Constants.TRANSPARENT_COLOR) {
      // When mousemoving the stroke tool, we draw in the canvas overlay above the drawing canvas.
      // If the stroke color is transparent, we won't be
      // able to see it during the movement.
      // We set it to a semi-opaque white during the tool mousemove allowing to see colors below the stroke.
      // When the stroke tool will be released, It will draw a transparent stroke,
      // eg deleting the equivalent of a stroke.
      color = Constants.SELECTION_TRANSPARENT_COLOR;
    }

    this.draw_(col, row, color, overlay, penSize, isStraight);
  }

  /**
   * @override
   */
  releaseToolAt(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame,
    event: MouseEvent
  ): void {
    const penSize = assertDefined(
      app.penSizeService,
      "penSizeService"
    ).getPenSize();
    const isStraight = event.shiftKey;
    const color = this.getToolColor();

    // The user released the tool to draw a line. We will compute the pixel coordinate, impact
    // the model and draw them in the drawing canvas (not the fake overlay anymore)
    this.draw_(col, row, color, frame, penSize, isStraight);

    // For now, we are done with the stroke tool and don't need an overlay anymore:
    overlay.clear();

    this.raiseSaveStateEvent({
      col: col,
      row: row,
      startCol: this.startCol,
      startRow: this.startRow,
      color: color,
      penSize: penSize,
      isStraight: isStraight
    });
  }

  draw_(
    col: number,
    row: number,
    color: string | number,
    targetFrame: Frame,
    penSize: number,
    isStraight: boolean
  ): void {
    let linePixels;
    if (isStraight) {
      linePixels = PixelUtils.getUniformLinePixels(
        Number(this.startCol),
        col,
        Number(this.startRow),
        row
      );
    } else {
      linePixels = PixelUtils.getLinePixels(
        col,
        Number(this.startCol),
        row,
        Number(this.startRow)
      );
    }

    //draw the square ends of the line
    PixelUtils.resizePixel(
      linePixels[0].col,
      linePixels[0].row,
      penSize
    ).forEach(function (point) {
      targetFrame.setPixel(point[0], point[1], color);
    });
    PixelUtils.resizePixel(
      linePixels[linePixels.length - 1].col,
      linePixels[linePixels.length - 1].row,
      penSize
    ).forEach(function (point) {
      targetFrame.setPixel(point[0], point[1], color);
    });

    //for each step along the line, draw an x centered on that pixel of size penSize
    linePixels.forEach(function (point) {
      for (let i = 0; i < penSize; i++) {
        targetFrame.setPixel(
          point.col - Math.floor(penSize / 2) + i,
          point.row - Math.floor(penSize / 2) + i,
          color
        );
        targetFrame.setPixel(
          point.col - Math.floor(penSize / 2) + i,
          point.row + Math.ceil(penSize / 2) - i - 1,
          color
        );
        //draw an additional x directly next to the first to prevent unwanted dithering
        if (i !== 0) {
          targetFrame.setPixel(
            point.col - Math.floor(penSize / 2) + i,
            point.row - Math.floor(penSize / 2) + i - 1,
            color
          );
          targetFrame.setPixel(
            point.col - Math.floor(penSize / 2) + i,
            point.row + Math.ceil(penSize / 2) - i,
            color
          );
        }
      }
    });
  }

  replay(
    frame: Frame,
    replayData: {
      startCol: number | null;
      startRow: number | null;
      col: number;
      row: number;
      color: string | number;
      penSize: number;
      isStraight: boolean;
    }
  ): void {
    this.startCol = replayData.startCol;
    this.startRow = replayData.startRow;
    this.draw_(
      replayData.col,
      replayData.row,
      replayData.color,
      frame,
      replayData.penSize,
      replayData.isStraight
    );
  }
}
