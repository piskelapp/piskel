import type { Frame } from "../model/Frame";
import { PixelUtils } from "../utils/PixelUtils";
import { BaseSelection, type SelectionPixel } from "./BaseSelection";

const OUTSIDE = -1;

const INSIDE = 1;

const VISITED = 2;

export class LassoSelection extends BaseSelection {
  pixelsMap: Record<number, Record<number, number>>;

  constructor(pixels: SelectionPixel[], frame: Frame) {
    super();
    // transform the selected pixels array to a Map to get a faster lookup
    this.pixelsMap = {};
    pixels.forEach((pixel: SelectionPixel) => {
      this.setPixelInMap_(pixel, INSIDE);
    });

    this.pixels = this.getLassoPixels_(frame);
  }

  getLassoPixels_(frame: Frame): { col: number; row: number }[] {
    const lassoPixels: { col: number; row: number }[] = [];

    frame.forEachPixel((color: number, pixelCol: number, pixelRow: number) => {
      const pixel = { col: pixelCol, row: pixelRow };
      if (this.isInSelection_(pixel, frame)) {
        lassoPixels.push(pixel);
      }
    });

    return lassoPixels;
  }

  isInSelection_(pixel: { col: number; row: number }, frame: Frame): boolean {
    const alreadyVisited = this.getPixelInMap_(pixel);
    if (!alreadyVisited) {
      this.visitPixel_(pixel, frame);
    }

    return this.getPixelInMap_(pixel) == INSIDE;
  }

  visitPixel_(pixel: SelectionPixel, frame: Frame): void {
    let frameBorderReached = false;
    const visitedPixels = PixelUtils.visitConnectedPixels(
      pixel,
      frame,
      (connectedPixel: { col: number; row: number }) => {
        const alreadyVisited = this.getPixelInMap_(connectedPixel);
        if (alreadyVisited) {
          return false;
        }

        if (!frame.containsPixel(connectedPixel.col, connectedPixel.row)) {
          frameBorderReached = true;
          return false;
        }

        this.setPixelInMap_(connectedPixel, VISITED);
        return true;
      }
    );

    visitedPixels.forEach((visitedPixel) => {
      this.setPixelInMap_(visitedPixel, frameBorderReached ? OUTSIDE : INSIDE);
    });
  }

  setPixelInMap_(pixel: SelectionPixel, value: number): void {
    this.pixelsMap[pixel.col] = this.pixelsMap[pixel.col] || {};
    this.pixelsMap[pixel.col][pixel.row] = value;
  }

  getPixelInMap_(pixel: SelectionPixel): number | undefined {
    return this.pixelsMap[pixel.col] && this.pixelsMap[pixel.col][pixel.row];
  }
}
