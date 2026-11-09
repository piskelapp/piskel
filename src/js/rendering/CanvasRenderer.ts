import { Constants } from "../Constants";
import type { Frame } from "../model/Frame";
import { RenderedFrame } from "../model/frame/RenderedFrame";
import { CanvasUtils } from "../utils/CanvasUtils";
import { assertDefined, colorToInt } from "../utils/core";

const offCanvasPool: Record<string, HTMLCanvasElement> = {};
const imageDataPool: Record<string, ImageData> = {};

/**
 * Draw the provided frame in a 2d canvas
 *
 * @param {Frame|RenderedFrame} frame the frame to draw
 * @param {Canvas} canvas the canvas target
 * @param {String} transparentColor (optional) color to use to represent transparent pixels.
 * @param {String} globalAlpha (optional) global frame opacity
 */
export function drawFrameToCanvas(
  frame: Frame | RenderedFrame,
  canvas: HTMLCanvasElement,
  transparentColor?: string,
  globalAlpha?: number
): void {
  const context = assertDefined(canvas.getContext("2d"), "context");
  globalAlpha =
    globalAlpha === undefined || isNaN(globalAlpha) ? 1 : globalAlpha;
  context.globalAlpha = globalAlpha;
  transparentColor = transparentColor || Constants.TRANSPARENT_COLOR;

  if (frame instanceof RenderedFrame) {
    context.drawImage(frame.getRenderedFrame(), 0, 0);
  } else {
    const w = frame.getWidth();
    const h = frame.getHeight();
    let pixels = frame.pixels;

    // Replace transparent color
    const constantTransparentColorInt = colorToInt(Constants.TRANSPARENT_COLOR);
    const transparentColorInt = colorToInt(transparentColor);
    if (transparentColorInt != constantTransparentColorInt) {
      pixels = frame.getPixels();
      for (let i = 0, length = pixels.length; i < length; i++) {
        if (pixels[i] == constantTransparentColorInt) {
          pixels[i] = transparentColorInt;
        }
      }
    }

    // Imagedata from cache
    const imageDataKey = w + "-" + h;
    let imageData;
    if (!imageDataPool[imageDataKey]) {
      imageData = imageDataPool[imageDataKey] = context.createImageData(w, h);
    } else {
      imageData = imageDataPool[imageDataKey];
    }

    // Convert to uint8 and set the data
    const data = new Uint8ClampedArray(pixels.buffer);
    const imgDataData = imageData.data;
    imgDataData.set(data);

    // Offcanvas from cache
    const offCanvasKey = w + "-" + h;
    let offCanvas;
    if (!offCanvasPool[offCanvasKey]) {
      offCanvas = offCanvasPool[offCanvasKey] = CanvasUtils.createCanvas(w, h);
    } else {
      offCanvas = offCanvasPool[offCanvasKey];
    }

    // Put pixel data to offcanvas and draw the offcanvas onto the canvas
    assertDefined(offCanvas.getContext("2d"), "context").putImageData(
      imageData,
      0,
      0
    );
    context.drawImage(offCanvas, 0, 0, w, h);
    context.globalAlpha = 1;
  }
}

export class CanvasRenderer {
  frame: Frame | RenderedFrame;
  zoom: number;
  opacity_: number;
  transparentColor_: string;

  constructor(frame: Frame | RenderedFrame, zoom: number) {
    this.frame = frame;
    this.zoom = zoom;
    this.opacity_ = 1;
    this.transparentColor_ = "white";
  }

  /**
   * Decide which color should be used to represent transparent pixels
   * Default : white
   * @param  {String} color the color to use either as '#ABCDEF' or 'red' or 'rgb(x,y,z)' or 'rgba(x,y,z,a)'
   */
  drawTransparentAs(color: string): void {
    this.transparentColor_ = color;
  }

  setOpacity(opacity: number): void {
    this.opacity_ = opacity;
  }

  render(): HTMLCanvasElement {
    const canvas = this.createCanvas_();

    // Draw in canvas
    drawFrameToCanvas(
      this.frame,
      canvas,
      this.transparentColor_,
      this.opacity_
    );

    const scaledCanvas = this.createCanvas_(this.zoom);
    const scaledContext = assertDefined(
      scaledCanvas.getContext("2d"),
      "context"
    );
    CanvasUtils.disableImageSmoothing(scaledCanvas);
    scaledContext.scale(this.zoom, this.zoom);
    scaledContext.drawImage(canvas, 0, 0);

    return scaledCanvas;
  }

  createCanvas_(zoom?: number): HTMLCanvasElement {
    zoom = zoom || 1;
    const width = this.frame.getWidth() * zoom;
    const height = this.frame.getHeight() * zoom;
    return CanvasUtils.createCanvas(width, height);
  }
}
