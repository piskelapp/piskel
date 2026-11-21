import { Constants } from "@/Constants";
import { app } from "@/app";
import type { Frame } from "@/model/Frame";
import { PixelUtils } from "@/utils/PixelUtils";
import { assertInitialized, intToColor } from "@/utils/core";
import { Tool } from "@/tools/Tool";

export abstract class BaseTool extends Tool {
  highlightedPixelCol: number | null | undefined;
  highlightedPixelRow: number | null | undefined;

  applyToolAt(
    _col: number,
    _row: number,
    _frame: Frame,
    _overlay: Frame,
    _event: MouseEvent
  ): void {}

  moveToolAt(
    _col: number,
    _row: number,
    _frame: Frame,
    _overlay: Frame,
    _event: MouseEvent
  ): void {}

  supportsDynamicPenSize() {
    return false;
  }

  getToolColor(): string {
    if (
      assertInitialized(
        app.mouseStateService,
        "mouseStateService"
      ).isRightButtonPressed()
    ) {
      return assertInitialized(
        app.selectedColorsService,
        "selectedColorsService"
      ).getSecondaryColor();
    }
    return assertInitialized(
      app.selectedColorsService,
      "selectedColorsService"
    ).getPrimaryColor();
  }

  moveUnactiveToolAt(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame,
    _event: MouseEvent
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
      ? assertInitialized(app.penSizeService, "penSizeService").getPenSize()
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
    _col: number,
    _row: number,
    _frame: Frame,
    _overlay: Frame,
    _event: MouseEvent
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
