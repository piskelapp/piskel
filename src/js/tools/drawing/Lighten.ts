import { Constants } from "../../Constants";
import { app } from "../../app";
import type { Frame } from "../../model/Frame";
import { Shortcuts } from "../../service/keyboard/Shortcuts";
import { PixelUtils } from "../../utils/PixelUtils";
import type { TooltipDescriptor } from "../../utils/TooltipFormatter";
import { UserAgent } from "../../utils/UserAgent";
import { assertDefined, colorToInt, intToColor } from "../../utils/core";
import { SimplePen } from "./SimplePen";

const DEFAULT_STEP = 3;

export class Lighten extends SimplePen {
  tooltipDescriptors: TooltipDescriptor[];

  constructor() {
    super();

    this.toolId = "tool-lighten";
    this.helpText = "Lighten";
    this.shortcut = Shortcuts.TOOL.LIGHTEN;

    this.tooltipDescriptors = [
      { key: "ctrl", description: "Darken" },
      { key: "shift", description: "Apply only once per pixel" }
    ];
  }

  /**
   * @Override
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
      const modifiedColor = this.getModifiedColor_(
        point[0],
        point[1],
        frame,
        overlay,
        event
      );
      // Out of the frame, where drawing would have no effect.
      if (modifiedColor === null) {
        return;
      }
      this.draw(modifiedColor, point[0], point[1], frame, overlay);
    });
  }

  getModifiedColor_(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame,
    event: MouseEvent
  ): string | number | null {
    // get colors in overlay and in frame
    const overlayColor = overlay.getPixel(col, row);
    const frameColor = frame.getPixel(col, row);

    const isPixelModified =
      overlayColor !== colorToInt(Constants.TRANSPARENT_COLOR);
    const pixelColor = isPixelModified ? overlayColor : frameColor;

    const isTransparent =
      pixelColor === colorToInt(Constants.TRANSPARENT_COLOR);
    if (isTransparent) {
      return Constants.TRANSPARENT_COLOR;
    }

    const oncePerPixel = event.shiftKey;
    if (oncePerPixel && isPixelModified) {
      return pixelColor;
    }

    const step = oncePerPixel ? DEFAULT_STEP * 2 : DEFAULT_STEP;
    const isDarken = UserAgent.isMac ? event.metaKey : event.ctrlKey;

    let color;
    if (isDarken) {
      color = window.tinycolor.darken(intToColor(pixelColor), step);
    } else {
      color = window.tinycolor.lighten(intToColor(pixelColor), step);
    }

    // Convert tinycolor color to string format.
    return color.toHexString();
  }
}
