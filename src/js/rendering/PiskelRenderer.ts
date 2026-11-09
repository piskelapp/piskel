import type { PublicPiskelController } from "../controller/piskel/PublicPiskelController";
import { CanvasUtils } from "../utils/CanvasUtils";
import { assertDefined } from "../utils/core";

export class PiskelRenderer {
  piskelController: PublicPiskelController;
  frames: HTMLCanvasElement[];

  constructor(piskelController: PublicPiskelController) {
    const frames = [];
    for (let i = 0; i < piskelController.getFrameCount(); i++) {
      frames.push(piskelController.renderFrameAt(i, true));
    }
    this.piskelController = piskelController;
    this.frames = frames;
  }

  renderAsCanvas(columns?: number): HTMLCanvasElement {
    columns = columns || this.frames.length;
    const rows = Math.ceil(this.frames.length / columns);

    const canvas = this.createCanvas_(columns, rows);

    for (let i = 0; i < this.frames.length; i++) {
      const frame = this.frames[i];
      const posX = (i % columns) * this.piskelController.getWidth();
      const posY = Math.floor(i / columns) * this.piskelController.getHeight();
      this.drawFrameInCanvas_(frame, canvas, posX, posY);
    }
    return canvas;
  }

  drawFrameInCanvas_(
    frame: HTMLCanvasElement,
    canvas: HTMLCanvasElement,
    offsetWidth: number,
    offsetHeight: number
  ): void {
    const context = assertDefined(canvas.getContext("2d"), "context");
    context.drawImage(
      frame,
      offsetWidth,
      offsetHeight,
      frame.width,
      frame.height
    );
  }

  createCanvas_(columns: number, rows: number): HTMLCanvasElement {
    const width = columns * this.piskelController.getWidth();
    const height = rows * this.piskelController.getHeight();
    return CanvasUtils.createCanvas(width, height);
  }
}
