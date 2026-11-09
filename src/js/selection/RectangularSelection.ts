import { PixelUtils } from "../utils/PixelUtils";
import { BaseSelection } from "./BaseSelection";

export class RectangularSelection extends BaseSelection {
  constructor(x0: number, y0: number, x1: number, y1: number) {
    super();
    this.pixels = PixelUtils.getRectanglePixels(x0, y0, x1, y1);
  }
}
