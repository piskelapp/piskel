import { Constants } from "../../Constants";
import { app } from "../../app";
import type { Frame } from "../../model/Frame";
import { PixelUtils } from "../../utils/PixelUtils";
import { assertDefined, intToColor } from "../../utils/core";
import { Tool } from "../Tool";

export class BaseTool extends Tool {
  highlightedPixelCol: number | null | undefined;
  highlightedPixelRow: number | null | undefined;

  applyToolAt(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame,
    event: MouseEvent
  ): void {}

  moveToolAt(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame,
    event: MouseEvent
  ): void {}

  replay(frame: Frame, replayData: unknown): void {
    return Constants.ABSTRACT_FUNCTION();
  }

  supportsDynamicPenSize() {
    return false;
  }

  getToolColor(): string {
    if (
      assertDefined(
        app.mouseStateService,
        "mouseStateService"
      ).isRightButtonPressed()
    ) {
      return assertDefined(
        app.selectedColorsService,
        "selectedColorsService"
      ).getSecondaryColor();
    }
    return assertDefined(
      app.selectedColorsService,
      "selectedColorsService"
    ).getPrimaryColor();
  }

  moveUnactiveToolAt(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame,
    event: MouseEvent
  ): void {
    if (overlay.containsPixel(col, row)) {
      this.updateHighlightedPixel(frame, overlay, col, row);
    } else {
      this.hideHighlightedPixel(overlay);
    }
  }

  updateHighlightedPixel(
    frame: Frame,
    overlay: Frame,
    col: number,
    row: number
  ): void {
    if (
      !isNaN(Number(this.highlightedPixelCol)) &&
      !isNaN(Number(this.highlightedPixelRow)) &&
      (this.highlightedPixelRow != row || this.highlightedPixelCol != col)
    ) {
      // Clean the previously highlighted pixel:
      overlay.clear();
    }

    const frameColor = intToColor(frame.getPixel(col, row));
    const highlightColor = this.getHighlightColor_(frameColor);
    const size = this.supportsDynamicPenSize()
      ? assertDefined(app.penSizeService, "penSizeService").getPenSize()
      : 1;
    PixelUtils.resizePixel(col, row, size).forEach(function (point) {
      overlay.setPixel(point[0], point[1], highlightColor);
    });

    this.highlightedPixelCol = col;
    this.highlightedPixelRow = row;
  }

  getHighlightColor_(frameColor: string | number): string {
    if (!frameColor) {
      return Constants.TOOL_HIGHLIGHT_COLOR_DARK;
    }

    const luminance = window.tinycolor(intToColor(frameColor)).toHsl().l;
    if (luminance > 0.5) {
      return Constants.TOOL_HIGHLIGHT_COLOR_DARK;
    } else {
      return Constants.TOOL_HIGHLIGHT_COLOR_LIGHT;
    }
  }

  hideHighlightedPixel(overlay: Frame): void {
    if (
      this.highlightedPixelRow !== null &&
      this.highlightedPixelCol !== null
    ) {
      overlay.clear();
      this.highlightedPixelRow = null;
      this.highlightedPixelCol = null;
    }
  }

  releaseToolAt(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame,
    event: MouseEvent
  ): void {}

  /**
   * Does the tool support the ALT modifier. To be overridden by subclasses.
   *
   * @return {Boolean} true if the tool supports ALT.
   */
  supportsAlt() {
    return false;
  }
}
