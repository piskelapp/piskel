import { Events } from "../Events";
import { app } from "../app";
import type { JQueryEvent } from "../lib/jquery-1.8.0";
import { Dom } from "../utils/Dom";
import { assertDefined } from "../utils/core";
import type { PublicPiskelController } from "./piskel/PublicPiskelController";

export class CursorCoordinatesController {
  piskelController: PublicPiskelController;
  origin: { x: number; y: number } | null;
  coordinates: { x: number; y: number };
  coordinatesContainer: HTMLElement | undefined;

  constructor(piskelController: PublicPiskelController) {
    this.piskelController = piskelController;
    this.origin = null;
    this.coordinates = {
      x: -1,
      y: -1
    };
  }

  init(): void {
    this.coordinatesContainer = Dom.getElement<HTMLElement>(
      ".cursor-coordinates"
    );

    $.subscribe(Events.CURSOR_MOVED, this.onCursorMoved_.bind(this));
    $.subscribe(Events.DRAG_START, this.onDragStart_.bind(this));
    $.subscribe(Events.DRAG_END, this.onDragEnd_.bind(this));
    $.subscribe(Events.FRAME_SIZE_CHANGED, this.redraw.bind(this));
    $.subscribe(Events.ZOOM_CHANGED, this.redraw.bind(this));
    $.subscribe(Events.PISKEL_RESET, this.redraw.bind(this));

    this.redraw();
  }

  redraw(): void {
    let html = "";
    if (this.origin) {
      html += this.origin.x + ":" + this.origin.y + " to ";
    }

    const x = this.coordinates.x;
    const y = this.coordinates.y;
    const currentFrame = this.piskelController.getCurrentFrame();
    if (currentFrame.containsPixel(x, y)) {
      html += x + ":" + y;
      if (this.origin) {
        const dX = Math.abs(x - this.origin.x) + 1;
        const dY = Math.abs(y - this.origin.y) + 1;
        html += " (" + dX + "x" + dY + ")";
      }
    }

    if (app.drawingController) {
      const zoom = app.drawingController.compositeRenderer.getZoom().toFixed(2);
      html += '<div class="drawing-zoom">x' + zoom + "</div>";
    }

    assertDefined(this.coordinatesContainer, "coordinatesContainer").innerHTML =
      this.getFrameSizeHTML_() + html + this.getCurrentFrameIndexHTML_();
  }

  getCurrentFrameIndexHTML_(): string {
    const currentFrameIndex = this.piskelController.getCurrentFrameIndex() + 1;
    const frameCount = this.piskelController.getFrameCount();
    return (
      '<div class="frame-info">' +
      currentFrameIndex +
      "/" +
      frameCount +
      "</div>"
    );
  }

  getFrameSizeHTML_(): string {
    const w = this.piskelController.getWidth();
    const h = this.piskelController.getHeight();
    return "[" + w + "x" + h + "] ";
  }

  onCursorMoved_(event: JQueryEvent, x: number, y: number): void {
    this.coordinates = {
      x: x,
      y: y
    };
    this.redraw();
  }

  onDragStart_(event: JQueryEvent, x: number, y: number): void {
    this.origin = {
      x: x,
      y: y
    };
    this.redraw();
  }

  onDragEnd_(event: JQueryEvent): void {
    this.origin = null;
    this.redraw();
  }
}
