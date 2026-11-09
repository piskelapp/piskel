import { Constants } from "../../Constants";
import { app } from "../../app";
import type { Frame } from "../../model/Frame";
import type { Shortcut } from "../../service/keyboard/Shortcut";
import { Shortcuts } from "../../service/keyboard/Shortcuts";
import { PixelUtils } from "../../utils/PixelUtils";
import { assertDefined } from "../../utils/core";
import { BaseTool } from "./BaseTool";

export type ColoredPixel = {
  col: number;
  row: number;
  color: string | number;
};

export class SimplePen extends BaseTool {
  shortcut: Shortcut;
  previousCol: number | null;
  previousRow: number | null;
  pixels: ColoredPixel[];

  constructor() {
    super();
    this.toolId = "tool-pen";
    this.helpText = "Pen tool";
    this.shortcut = Shortcuts.TOOL.PEN;

    this.previousCol = null;
    this.previousRow = null;

    this.pixels = [];
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
    this.previousCol = col;
    this.previousRow = row;

    const color = this.getToolColor();

    this.drawUsingPenSize(color, col, row, frame, overlay);
  }

  drawUsingPenSize(
    color: string | number,
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame
  ): void {
    const penSize = assertDefined(
      app.penSizeService,
      "penSizeService"
    ).getPenSize();
    const points = PixelUtils.resizePixel(col, row, penSize);
    points.forEach((point) => {
      this.draw(color, point[0], point[1], frame, overlay);
    });
  }

  draw(
    color: string | number,
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame
  ): void {
    overlay.setPixel(col, row, color);
    if (color === Constants.TRANSPARENT_COLOR) {
      frame.setPixel(col, row, color);
    }
    this.pixels.push({
      col: col,
      row: row,
      color: color
    });
  }

  /**
   * @override
   */
  moveToolAt(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame,
    event: MouseEvent
  ): void {
    if (
      Math.abs(col - Number(this.previousCol)) > 1 ||
      Math.abs(row - Number(this.previousRow)) > 1
    ) {
      // The pen movement is too fast for the mousemove frequency, there is a gap between the
      // current point and the previously drawn one.
      // We fill the gap by calculating missing dots (simple linear interpolation) and draw them.
      const interpolatedPixels = PixelUtils.getLinePixels(
        col,
        Number(this.previousCol),
        row,
        Number(this.previousRow)
      );
      for (let i = 0, l = interpolatedPixels.length; i < l; i++) {
        const coords = interpolatedPixels[i];
        this.applyToolAt(coords.col, coords.row, frame, overlay, event);
      }
    } else {
      this.applyToolAt(col, row, frame, overlay, event);
    }

    this.previousCol = col;
    this.previousRow = row;
  }

  releaseToolAt(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame,
    event: MouseEvent
  ): void {
    // apply on real frame
    this.setPixelsToFrame_(frame, this.pixels);

    // save state
    this.raiseSaveStateEvent({
      pixels: this.pixels.slice(0),
      color: this.getToolColor()
    });

    // reset
    this.resetUsedPixels_();
  }

  replay(
    frame: Frame,
    replayData: { pixels: ColoredPixel[]; color: string | number }
  ): void {
    this.setPixelsToFrame_(frame, replayData.pixels, replayData.color);
  }

  setPixelsToFrame_(
    frame: Frame,
    pixels: ColoredPixel[],
    color?: string | number
  ): void {
    pixels.forEach(function (pixel: ColoredPixel) {
      frame.setPixel(pixel.col, pixel.row, pixel.color);
    });
  }

  resetUsedPixels_(): void {
    this.pixels = [];
  }
}
