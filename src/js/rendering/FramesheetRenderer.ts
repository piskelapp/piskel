import type { Frame } from "../model/Frame";
import { CanvasUtils } from "../utils/CanvasUtils";
import { assertDefined } from "../utils/core";

/**
 * Render an array of frames
 * @param {Array.<pskl.model.Frame>} frames
 */
export class FramesheetRenderer {
  frames: Frame[];

  constructor(frames: Frame[]) {
    if (frames.length > 0) {
      this.frames = frames;
    } else {
      throw "FramesheetRenderer : Invalid argument : frames is empty";
    }
  }

  renderAsCanvas(columns?: number): HTMLCanvasElement {
    columns = columns || this.frames.length;
    const rows = Math.ceil(this.frames.length / columns);

    const canvas = this.createCanvas_(columns, rows);

    for (let i = 0; i < this.frames.length; i++) {
      const frame = this.frames[i];
      const posX = (i % columns) * frame.getWidth();
      const posY = Math.floor(i / columns) * frame.getHeight();
      this.drawFrameInCanvas_(frame, canvas, posX, posY);
    }
    return canvas;
  }

  drawFrameInCanvas_(
    frame: Frame,
    canvas: HTMLCanvasElement,
    offsetWidth: number,
    offsetHeight: number
  ): void {
    const context = assertDefined(canvas.getContext("2d"), "context");
    const imageData = context.createImageData(
      frame.getWidth(),
      frame.getHeight()
    );
    const pixels = frame.getPixels();
    const data = new Uint8ClampedArray(pixels.buffer);
    imageData.data.set(data);
    context.putImageData(imageData, offsetWidth, offsetHeight);
  }

  createCanvas_(columns: number, rows: number): HTMLCanvasElement {
    const sampleFrame = this.frames[0];
    const width = columns * sampleFrame.getWidth();
    const height = rows * sampleFrame.getHeight();
    return CanvasUtils.createCanvas(width, height);
  }
}
