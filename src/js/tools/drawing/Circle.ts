import type { Frame } from "../../model/Frame";
import type { Shortcut } from "../../service/keyboard/Shortcut";
import { Shortcuts } from "../../service/keyboard/Shortcuts";
import { PixelUtils } from "../../utils/PixelUtils";
import { ShapeTool } from "./ShapeTool";

export class Circle extends ShapeTool {
  shortcut: Shortcut;

  constructor() {
    super();

    this.toolId = "tool-circle";
    this.helpText = "Circle tool";
    this.shortcut = Shortcuts.TOOL.CIRCLE;
  }

  /**
   * @override
   */
  draw(
    col: number,
    row: number,
    color: string | number,
    targetFrame: Frame,
    penSize: number
  ): void {
    this.getCirclePixels_(
      Number(this.startCol),
      Number(this.startRow),
      col,
      row,
      penSize
    ).forEach(function (point) {
      targetFrame.setPixel(point[0], point[1], color);
    });
  }

  getCirclePixels_(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    penSize: number
  ): number[][] {
    const coords = PixelUtils.getOrderedRectangleCoordinates(x0, y0, x1, y1);
    const pixels = [];
    const xC = Math.round((coords.x0 + coords.x1) / 2);
    const yC = Math.round((coords.y0 + coords.y1) / 2);
    const evenX = (coords.x0 + coords.x1) % 2;
    const evenY = (coords.y0 + coords.y1) % 2;
    const rX = coords.x1 - xC;
    const rY = coords.y1 - yC;

    let x;
    let y;
    let angle;
    let r;

    if (penSize == 1) {
      for (x = coords.x0; x <= xC; x++) {
        angle = Math.acos((x - xC) / rX);
        y = Math.round(rY * Math.sin(angle) + yC);
        pixels.push([x - evenX, y]);
        pixels.push([x - evenX, 2 * yC - y - evenY]);
        pixels.push([2 * xC - x, y]);
        pixels.push([2 * xC - x, 2 * yC - y - evenY]);
      }
      for (y = coords.y0; y <= yC; y++) {
        angle = Math.asin((y - yC) / rY);
        x = Math.round(rX * Math.cos(angle) + xC);
        pixels.push([x, y - evenY]);
        pixels.push([2 * xC - x - evenX, y - evenY]);
        pixels.push([x, 2 * yC - y]);
        pixels.push([2 * xC - x - evenX, 2 * yC - y]);
      }
      return pixels;
    }

    let iX = rX - penSize;
    let iY = rY - penSize;
    if (iX < 0) {
      iX = 0;
    }
    if (iY < 0) {
      iY = 0;
    }

    for (x = 0; x <= rX; x++) {
      for (y = 0; y <= rY; y++) {
        angle = Math.atan(y / x);
        r = Math.sqrt(x * x + y * y);
        if (
          (rX <= penSize ||
            rY <= penSize ||
            r >
              (iX * iY) /
                Math.sqrt(
                  iY * iY * Math.pow(Math.cos(angle), 2) +
                    iX * iX * Math.pow(Math.sin(angle), 2)
                ) +
                0.5) &&
          r <
            (rX * rY) /
              Math.sqrt(
                rY * rY * Math.pow(Math.cos(angle), 2) +
                  rX * rX * Math.pow(Math.sin(angle), 2)
              ) +
              0.5
        ) {
          pixels.push([xC + x, yC + y]);
          pixels.push([xC - x - evenX, yC + y]);
          pixels.push([xC + x, yC - y - evenY]);
          pixels.push([xC - x - evenX, yC - y - evenY]);
        }
      }
    }

    return pixels;
  }
}
