import { Constants } from "../Constants";
import type { Frame } from "../model/Frame";
import { assertDefined } from "../utils/core";

export type SelectionPixel = {
  col: number;
  row: number;
  color?: string | number | null;
};

export class BaseSelection {
  pixels: SelectionPixel[] = [];
  time: number | undefined;
  hasPastedContent: boolean | undefined;

  stringify(): string {
    return JSON.stringify({
      pixels: this.pixels,
      time: this.time
    });
  }

  parse(str: string): void {
    const selectionData: { pixels: SelectionPixel[]; time: number } =
      JSON.parse(str);
    this.pixels = selectionData.pixels;
    this.time = selectionData.time;
  }

  reset(): void {
    this.pixels = [];
    this.hasPastedContent = false;
    this.time = -1;
  }

  move(colDiff: number, rowDiff: number): void {
    const movedPixels = [];

    for (
      let i = 0, l = assertDefined(this.pixels, "pixels").length;
      i < l;
      i++
    ) {
      const movedPixel = assertDefined(this.pixels, "pixels")[i];
      movedPixel.col += colDiff;
      movedPixel.row += rowDiff;
      movedPixels.push(movedPixel);
    }

    this.pixels = movedPixels;
  }

  fillSelectionFromFrame(targetFrame: Frame): void {
    assertDefined(this.pixels, "pixels").forEach(function (pixel) {
      const color = targetFrame.getPixel(pixel.col, pixel.row);
      pixel.color = color || Constants.TRANSPARENT_COLOR;
    });

    this.hasPastedContent = true;
    // Keep track of the selection time to compare between local selection and
    // paste event selections.
    this.time = Date.now();
  }
}
