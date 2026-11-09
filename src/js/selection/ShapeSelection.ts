import { BaseSelection, type SelectionPixel } from "./BaseSelection";

export class ShapeSelection extends BaseSelection {
  constructor(pixels: SelectionPixel[]) {
    super();
    this.pixels = pixels;
  }
}
