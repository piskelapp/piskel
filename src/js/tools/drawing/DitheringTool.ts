import { app } from "@/app";
import type { Frame } from "@/model/Frame";
import { Shortcuts } from "@/service/keyboard/Shortcuts";
import { PixelUtils } from "@/utils/PixelUtils";
import { assertInitialized } from "@/utils/core";
import { SimplePen } from "./SimplePen";

export class DitheringTool extends SimplePen {
  constructor() {
    super();
    this.toolId = "tool-dithering";
    this.helpText = "Dithering tool";
    this.shortcut = Shortcuts.TOOL.DITHERING;
  }

  supportsDynamicPenSize() {
    return true;
  }

  /**
   * @override
   */
  applyToolAt(col: number, row: number, frame: Frame, overlay: Frame): void {
    this.previousCol = col;
    this.previousRow = row;

    const penSize = assertInitialized(
      app.penSizeService,
      "penSizeService"
    ).getPenSize();
    const points = PixelUtils.resizePixel(col, row, penSize);
    points.forEach((point) => {
      this.applyToolOnPixel(point[0], point[1], frame, overlay);
    });
  }

  applyToolOnPixel(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame
  ): void {
    let usePrimaryColor: number | boolean = (col + row) % 2;

    if (
      assertInitialized(
        app.mouseStateService,
        "mouseStateService"
      ).isRightButtonPressed()
    ) {
      usePrimaryColor = !usePrimaryColor;
    }

    const ditheringColor = usePrimaryColor
      ? assertInitialized(
          app.selectedColorsService,
          "selectedColorsService"
        ).getPrimaryColor()
      : assertInitialized(
          app.selectedColorsService,
          "selectedColorsService"
        ).getSecondaryColor();

    this.draw(ditheringColor, col, row, frame, overlay);
  }
}
