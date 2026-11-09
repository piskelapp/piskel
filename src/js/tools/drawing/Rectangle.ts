import type { Frame } from "../../model/Frame";
import type { Shortcut } from "../../service/keyboard/Shortcut";
import { Shortcuts } from "../../service/keyboard/Shortcuts";
import { PixelUtils } from "../../utils/PixelUtils";
import { ShapeTool } from "./ShapeTool";

export class Rectangle extends ShapeTool {
  shortcut: Shortcut;

  constructor() {
    super();

    this.toolId = "tool-rectangle";
    this.helpText = "Rectangle tool";
    this.shortcut = Shortcuts.TOOL.RECTANGLE;
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
    const rectangle = PixelUtils.getOrderedRectangleCoordinates(
      Number(this.startCol),
      Number(this.startRow),
      col,
      row
    );

    for (let x = rectangle.x0; x <= rectangle.x1; x++) {
      for (let y = rectangle.y0; y <= rectangle.y1; y++) {
        if (
          x > rectangle.x1 - penSize ||
          x < rectangle.x0 + penSize ||
          y > rectangle.y1 - penSize ||
          y < rectangle.y0 + penSize
        ) {
          targetFrame.setPixel(x, y, color);
        }
      }
    }
  }
}
