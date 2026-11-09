import { Constants } from "../Constants";
import { Frame } from "../model/Frame";
import type { RenderedFrame } from "../model/frame/RenderedFrame";
import { CanvasRenderer, drawFrameToCanvas } from "../rendering/CanvasRenderer";
import { CanvasUtils } from "./CanvasUtils";
import { ImageResizer } from "./ImageResizer";
import { assertDefined, colorToInt } from "./core";

export type ChunkFrame = { index: number; frame: Frame };

export const FrameUtils = {
  /**
   * Render a Frame object as an image.
   * Can optionally scale it (zoom)
   * @param frame {Frame} frame
   * @param zoom {Number} zoom
   * @return {Image}
   */
  toImage(
    frame: Frame | RenderedFrame,
    zoom?: number,
    opacity?: number
  ): HTMLCanvasElement {
    zoom = zoom || 1;
    opacity = opacity === undefined || isNaN(opacity) ? 1 : opacity;

    const canvasRenderer = new CanvasRenderer(frame, zoom);
    canvasRenderer.drawTransparentAs(Constants.TRANSPARENT_COLOR);
    canvasRenderer.setOpacity(opacity);
    return canvasRenderer.render();
  },

  /**
   * Draw the provided frame in a 2d canvas
   *
   * @param {Frame|RenderedFrame} frame the frame to draw
   * @param {Canvas} canvas the canvas target
   * @param {String} transparentColor (optional) color to use to represent transparent pixels.
   * @param {String} globalAlpha (optional) global frame opacity
   */
  drawToCanvas(
    frame: Frame | RenderedFrame,
    canvas: HTMLCanvasElement,
    transparentColor?: string,
    globalAlpha?: number
  ): void {
    drawFrameToCanvas(frame, canvas, transparentColor, globalAlpha);
  },

  /**
   * Render a line of a single color in a given canvas 2D context.
   *
   * @param  color {String} color to draw
   * @param  x {Number} x coordinate
   * @param  y {Number} y coordinate
   * @param  width {Number} width of the line to draw, in pixels
   * @param  context {CanvasRenderingContext2D} context of the canvas target
   */
  renderLine_(
    color: string | number,
    x: number,
    y: number,
    width: number,
    context: {
      fillStyle: string | number;
      fillRect: (
        arg0: number,
        arg1: number,
        arg2: number,
        arg3: number
      ) => void;
    }
  ): void {
    if (color === Constants.TRANSPARENT_COLOR || color === null) {
      return;
    }
    context.fillStyle = color;
    context.fillRect(x, y, 1, width);
  },

  merge(frames: Frame[]): Frame | null {
    let merged = null;
    if (frames.length) {
      merged = frames[0].clone();
      for (let i = 1; i < frames.length; i++) {
        FrameUtils.mergeFrames_(merged, frames[i]);
      }
    }
    return merged;
  },

  mergeFrames_(frameA: Frame, frameB: Frame): void {
    const transparentColorInt = colorToInt(Constants.TRANSPARENT_COLOR);
    for (
      let i = 0, length = frameA.getWidth() * frameA.getHeight();
      i < length;
      ++i
    ) {
      if (
        frameB.pixels[i] != transparentColorInt &&
        frameA.pixels[i] != frameB.pixels[i]
      ) {
        frameA.pixels[i] = frameB.pixels[i];
      }
    }
  },

  /**
   * Insert the provided image in the provided frame, at the x, y sprite coordinates.
   * Coordinates will be adjusted so that the image fits in the frame, if possible.
   */
  addImageToFrame(
    frame: Frame,
    image: HTMLImageElement | HTMLCanvasElement,
    x: number,
    y: number
  ): void {
    const imageFrame = FrameUtils.createFromImage(image);
    x = x - Math.floor(imageFrame.width / 2);
    y = y - Math.floor(imageFrame.height / 2);

    x = Math.max(0, x);
    y = Math.max(0, y);

    if (imageFrame.width <= frame.width) {
      x = Math.min(x, frame.width - imageFrame.width);
    }

    if (imageFrame.height <= frame.height) {
      y = Math.min(y, frame.height - imageFrame.height);
    }

    imageFrame.forEachPixel(function (
      color: number,
      frameX: number,
      frameY: number
    ) {
      if (color != colorToInt(Constants.TRANSPARENT_COLOR)) {
        frame.setPixel(x + frameX, y + frameY, color);
      }
    });
  },

  resize(
    frame: Frame,
    targetWidth: number,
    targetHeight: number,
    smoothing: boolean
  ): Frame {
    const image = FrameUtils.toImage(frame);
    const resizedImage = ImageResizer.resize(
      image,
      targetWidth,
      targetHeight,
      smoothing
    );
    return FrameUtils.createFromImage(resizedImage);
  },

  removeTransparency(frame: Frame): void {
    frame.forEachPixel(function (color: number, x: number, y: number) {
      const alpha = ((color >> 24) >>> 0) & 0xff;
      if (alpha && alpha !== 255) {
        const rounded = Math.round(alpha / 255) * 255;
        const roundedColor =
          color - ((alpha << 24) >>> 0) + ((rounded << 24) >>> 0);
        frame.setPixel(x, y, roundedColor);
      }
    });
  },

  createFromCanvas(
    canvas: HTMLCanvasElement,
    x: number,
    y: number,
    w: number,
    h: number,
    preserveOpacity?: boolean
  ): Frame {
    const imgData = assertDefined(
      canvas.getContext("2d"),
      "context"
    ).getImageData(x, y, w, h).data;
    return FrameUtils.createFromImageData_(imgData, w, h, preserveOpacity);
  },

  createFromImageSrc(
    src: string,
    preserveOpacity: boolean,
    cb: (arg0: Frame) => void
  ): void {
    const image = new Image();
    image.addEventListener("load", function onImageLoaded() {
      image.removeEventListener("load", onImageLoaded);
      const frame = FrameUtils.createFromImage(image, preserveOpacity);
      cb(frame);
    });
    image.src = src;
  },

  /*
   * Create a pskl.model.Frame from an Image object. By default transparent
   * pixels will be converted to completely opaque or completely transparent
   * pixels. If preserveOpacity is true the actual opacity of the pixel will
   * be used and the generated frame will contain rgba pixels.
   *
   * @param  {Image} image source image
   * @param  {boolean} preserveOpacity set to true to preserve the opacity
   * @return {pskl.model.Frame} corresponding frame
   */
  createFromImage(
    image: HTMLImageElement | HTMLCanvasElement,
    preserveOpacity?: boolean
  ): Frame {
    const w = image.width;
    const h = image.height;
    const canvas = CanvasUtils.createCanvas(w, h);
    const context = assertDefined(canvas.getContext("2d"), "context");

    context.drawImage(image, 0, 0, w, h, 0, 0, w, h);
    const imgData = context.getImageData(0, 0, w, h).data;
    return FrameUtils.createFromImageData_(imgData, w, h, preserveOpacity);
  },

  createFromImageData_(
    imageData: ImageDataArray,
    width: number,
    height: number,
    preserveOpacity?: boolean
  ): Frame {
    const frame = new Frame(width, height);
    frame.pixels = new Uint32Array(imageData.buffer);
    if (!preserveOpacity) {
      FrameUtils.removeTransparency(frame);
    }

    return frame;
  },

  /**
   * Create a Frame array from an Image object.
   * Transparent pixels will either be converted to completely opaque or completely transparent pixels.
   *
   * @param  {Image} image source image
   * @param  {Number} frameCount number of frames in the spritesheet
   * @return {Array<Frame>}
   */
  createFramesFromSpritesheet(
    image: HTMLImageElement | HTMLCanvasElement,
    frameCount: number
  ): Frame[] {
    const layout = [];
    for (let i = 0; i < frameCount; i++) {
      layout.push([i]);
    }
    const chunkFrames = FrameUtils.createFramesFromChunk(image, layout);
    return chunkFrames.map(function (chunkFrame: ChunkFrame) {
      return chunkFrame.frame;
    });
  },

  /**
   * Create a Frame array from an Image object.
   * Transparent pixels will either be converted to completely opaque or completely transparent pixels.
   *
   * @param  {Image} image source image
   * @param  {Array <Array>} layout description of the frame indexes expected to be found in the chunk
   * @return {Array<Object>} array of objects containing: {index: frame index, frame: frame instance}
   */
  createFramesFromChunk(
    image: HTMLImageElement | HTMLCanvasElement,
    layout: number[][]
  ): ChunkFrame[] {
    const width = image.width;
    const height = image.height;

    // Recalculate the expected frame dimensions from the layout information
    const frameWidth = width / layout.length;
    const frameHeight = height / layout[0].length;

    // Create a canvas adapted to the image size
    const canvas = CanvasUtils.createCanvas(frameWidth, frameHeight);
    const context = assertDefined(canvas.getContext("2d"), "context");

    // Draw the zoomed-up pixels to a different canvas context
    const chunkFrames: ChunkFrame[] = [];
    for (let i = 0; i < layout.length; i++) {
      const row = layout[i];
      for (let j = 0; j < row.length; j++) {
        context.clearRect(0, 0, frameWidth, frameHeight);
        context.drawImage(
          image,
          frameWidth * i,
          frameHeight * j,
          frameWidth,
          frameHeight,
          0,
          0,
          frameWidth,
          frameHeight
        );
        const frame = FrameUtils.createFromCanvas(
          canvas,
          0,
          0,
          frameWidth,
          frameHeight
        );
        chunkFrames.push({
          index: layout[i][j],
          frame: frame
        });
      }
    }

    return chunkFrames;
  },

  toFrameGrid<T>(normalGrid: T[][]): T[][] {
    const frameGrid: T[][] = [];
    const w = normalGrid[0].length;
    const h = normalGrid.length;
    for (let x = 0; x < w; x++) {
      frameGrid[x] = [];
      for (let y = 0; y < h; y++) {
        frameGrid[x][y] = normalGrid[y][x];
      }
    }
    return frameGrid;
  }
};
