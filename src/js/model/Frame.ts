import { Constants } from "../Constants";
import { colorToInt } from "../utils/core";

let __idCounter = 0;

export type PixelGrid = ArrayLike<ArrayLike<string | number>>;
export type PixelBuffer = ArrayLike<number>;
export type PixelCallback = (
  color: number,
  col: number,
  row: number,
  frame: Frame
) => void;

const _emptyPixelGridCache: Record<string, Uint32Array> = {};

/** True if the first item is a column of pixels, rather than a pixel. */
const isPixelGrid = function (
  pixels: PixelGrid | ArrayLike<number>
): pixels is PixelGrid {
  const first = pixels[0];
  return typeof first !== "number" && Boolean(first.length);
};

export class Frame {
  width: number;
  height: number;
  id: number | string;
  version: number;
  pixels: Uint32Array;
  stateIndex: number;

  constructor(width: number, height: number) {
    if (width && height) {
      this.width = width;
      this.height = height;
      this.id = __idCounter++;
      this.version = 0;
      this.pixels = Frame.createEmptyPixelGrid_(width, height);
      this.stateIndex = 0;
    } else {
      throw (
        "Bad arguments in pskl.model.Frame constructor : " +
        width +
        ", " +
        height
      );
    }
  }

  static fromPixelGrid(
    pixels: PixelGrid | ArrayLike<number>,
    width?: number,
    height?: number
  ): Frame {
    if (pixels.length) {
      let w: number;
      let h: number;
      let buffer: ArrayLike<number>;

      if (isPixelGrid(pixels)) {
        w = pixels.length;
        h = pixels[0].length;
        const grid: number[] = [];
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const pixel = pixels[x][y];
            if (typeof pixel == "string") {
              grid[y * w + x] = colorToInt(pixel);
            } else {
              grid[y * w + x] = pixel;
            }
          }
        }
        buffer = grid;
      } else if (width && height) {
        w = width;
        h = height;
        buffer = pixels;
      } else {
        throw "Bad arguments in pskl.model.frame.fromPixelGrid, missing width and height";
      }

      const frame = new Frame(w, h);
      frame.setPixels(buffer);
      return frame;
    } else {
      throw "Bad arguments in pskl.model.Frame.fromPixelGrid";
    }
  }

  static createEmptyPixelGrid_(
    width: number,
    height: number
  ): Uint32Array<ArrayBuffer> {
    let pixels;
    const key = width + "-" + height;
    if (_emptyPixelGridCache[key]) {
      pixels = _emptyPixelGridCache[key];
    } else {
      pixels = _emptyPixelGridCache[key] = new Uint32Array(width * height);
      const transparentColorInt = colorToInt(Constants.TRANSPARENT_COLOR);
      pixels.fill(transparentColorInt);
    }

    return new Uint32Array(pixels);
  }

  static createEmptyFromFrame(frame: Frame): Frame {
    return new Frame(frame.getWidth(), frame.getHeight());
  }

  clone(): Frame {
    const clone = new Frame(this.width, this.height);
    clone.setPixels(this.pixels);
    return clone;
  }

  /**
   * Returns a copy of the pixels used by the frame
   */
  getPixels(): Uint32Array<ArrayBufferLike> {
    return this.clonePixels_(this.pixels);
  }

  /**
   * Copies the passed pixels into the frame.
   */
  setPixels(pixels: PixelBuffer): void {
    this.pixels = this.clonePixels_(pixels);
    this.version++;
  }

  clear(): void {
    this.pixels = Frame.createEmptyPixelGrid_(
      this.getWidth(),
      this.getHeight()
    );
    this.version++;
  }

  /**
   * Clone a set of pixels. Should be static utility method
   * @private
   */
  clonePixels_(pixels: PixelBuffer): Uint32Array {
    return new Uint32Array(pixels);
  }

  getHash(): string {
    return [this.id, this.version].join("-");
  }

  setPixel(x: number, y: number, color: string | number): void {
    if (this.containsPixel(x, y)) {
      const index = y * this.width + x;
      const p = this.pixels[index];
      color = colorToInt(color);

      if (p !== color) {
        this.pixels[index] = color || colorToInt(Constants.TRANSPARENT_COLOR);
        this.version++;
      }
    }
  }

  getPixel(x: number, y: number): number | null {
    if (this.containsPixel(x, y)) {
      return this.pixels[y * this.width + x];
    } else {
      return null;
    }
  }

  forEachPixel(callback: PixelCallback): void {
    const width = this.getWidth();
    const height = this.getHeight();
    const length = width * height;
    for (let i = 0; i < length; i++) {
      callback(this.pixels[i], i % width, Math.floor(i / width), this);
    }
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  containsPixel(col: number, row: number): boolean {
    return col >= 0 && row >= 0 && col < this.width && row < this.height;
  }

  isSameSize(otherFrame: Frame): boolean {
    return (
      this.getHeight() == otherFrame.getHeight() &&
      this.getWidth() == otherFrame.getWidth()
    );
  }
}
