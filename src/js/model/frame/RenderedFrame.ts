import { Constants } from "../../Constants";
import type { Frame, PixelBuffer, PixelCallback } from "../Frame";

/**
 * Create a frame instance that provides an image getter. Can be faster
 * to use after merging using transparency. Transparent frames are merged to
 * an image and this allows to reuse the image rather than retransform into
 * a frame before calling the renderers.
 *
 * This rendered frame should only be used with renderers that support it.
 *
 * @param {Function} imageFn getter that will create the image
 * @param {Number} width image width in pixels
 * @param {Number} height image height in pixels
 * @param {String} id will be used as hash, so should be as unique as possible
 */
export class RenderedFrame {
  width: number;
  height: number;
  id: string;
  renderFn: () => HTMLCanvasElement;

  constructor(
    renderFn: () => HTMLCanvasElement,
    width: number,
    height: number,
    id: string
  ) {
    this.width = width;
    this.height = height;
    this.id = id;
    this.renderFn = renderFn;
  }

  getRenderedFrame(): HTMLCanvasElement {
    return this.renderFn();
  }

  getHash(): string {
    return this.id;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  getPixels(): Uint32Array {
    return Constants.ABSTRACT_FUNCTION();
  }

  containsPixel(col: number, row: number): boolean {
    return Constants.ABSTRACT_FUNCTION();
  }

  isSameSize(otherFrame: Frame | RenderedFrame): boolean {
    return Constants.ABSTRACT_FUNCTION();
  }

  clone(): RenderedFrame {
    return Constants.ABSTRACT_FUNCTION();
  }

  setPixels(pixels: PixelBuffer): void {
    return Constants.ABSTRACT_FUNCTION();
  }

  clear(): void {
    return Constants.ABSTRACT_FUNCTION();
  }

  setPixel(x: number, y: number, color: string | number): void {
    return Constants.ABSTRACT_FUNCTION();
  }

  getPixel(x: number, y: number): number | null {
    return Constants.ABSTRACT_FUNCTION();
  }

  forEachPixel(callback: PixelCallback): void {
    return Constants.ABSTRACT_FUNCTION();
  }
}
