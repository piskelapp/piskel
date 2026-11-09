import { app } from "../../app";
import type { Frame } from "../../model/Frame";
import { Shortcuts } from "../../service/keyboard/Shortcuts";
import { PixelUtils } from "../../utils/PixelUtils";
import { assertDefined } from "../../utils/core";
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
  applyToolAt(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame,
    event: MouseEvent
  ): void {
    this.previousCol = col;
    this.previousRow = row;

    const penSize = assertDefined(
      app.penSizeService,
      "penSizeService"
    ).getPenSize();
    const points = PixelUtils.resizePixel(col, row, penSize);
    points.forEach((point) => {
      this.applyToolOnPixel(point[0], point[1], frame, overlay, event);
    });
  }

  applyToolOnPixel(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame,
    event: Event
  ): void {
    let usePrimaryColor: number | boolean = (col + row) % 2;

    if (
      assertDefined(
        app.mouseStateService,
        "mouseStateService"
      ).isRightButtonPressed()
    ) {
      usePrimaryColor = !usePrimaryColor;
    }

    const ditheringColor = usePrimaryColor
      ? assertDefined(
          app.selectedColorsService,
          "selectedColorsService"
        ).getPrimaryColor()
      : assertDefined(
          app.selectedColorsService,
          "selectedColorsService"
        ).getSecondaryColor();

    this.draw(ditheringColor, col, row, frame, overlay);
  }
}
