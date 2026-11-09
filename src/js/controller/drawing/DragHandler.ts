import { assertDefined } from "../../utils/core";
import type { DrawingController } from "../DrawingController";
/**
 * Multiplier applied between the mouse movement and viewport movement
 * @type {Number}
 */
const MULTIPLIER = 2;

/**
 * Dedicated handler to drag the drawing canvas using the mouse
 * Will store the initial coordinates as well as the status of the drag
 * @param {DrawingController} drawingController
 */
export class DragHandler {
  drawingController: DrawingController;
  isDragging_: boolean;
  origin: { x: number; y: number } | undefined;

  constructor(drawingController: DrawingController) {
    this.drawingController = drawingController;

    this.isDragging_ = false;
    this.updateOrigin_(-1, -1);
  }

  /**
   * Initialize a drag session.
   * @param {Number} x : x coordinate of the mouse event that initiated the drag
   * @param {Number} y : y coordinate of the mouse event that initiated the drag
   */
  startDrag(x: number, y: number): void {
    const coords = this.drawingController.getSpriteCoordinates(x, y);
    this.updateOrigin_(coords.x, coords.y);
  }

  /**
   * Update the drag status
   * @param {Number} x : x coordinate of the mouse event that triggered the update
   * @param {Number} y : y coordinate of the mouse event that triggered the update
   */
  updateDrag(x: number, y: number): void {
    const currentOffset = this.drawingController.getOffset();
    const offset = this.calculateOffset_(x, y);
    if (currentOffset.y !== offset.y || currentOffset.x !== offset.x) {
      this.isDragging_ = true;
      this.drawingController.setOffset(offset.x, offset.y);

      // retrieve the updated coordinates after moving the sprite
      // and store them as the new drag origin
      const coords = this.drawingController.getSpriteCoordinates(x, y);
      this.updateOrigin_(coords.x, coords.y);
    }
  }

  /**
   * Stop the drag session
   */
  stopDrag(): void {
    this.isDragging_ = false;
    this.origin = undefined;
  }

  /**
   * Will return true if the drag handler effectively MOVED the offset
   * during the current drag session
   */
  isDragging(): boolean {
    return this.isDragging_;
  }

  calculateOffset_(x: number, y: number): { x: number; y: number } {
    const coords = this.drawingController.getSpriteCoordinates(x, y);
    const currentOffset = this.drawingController.getOffset();

    const offset = {
      x:
        currentOffset.x -
        MULTIPLIER * (coords.x - assertDefined(this.origin, "origin").x),
      y:
        currentOffset.y -
        MULTIPLIER * (coords.y - assertDefined(this.origin, "origin").y)
    };

    return offset;
  }

  updateOrigin_(x: number, y: number): void {
    this.origin = this.origin || { x: x, y: y };
    this.origin.x = x;
    this.origin.y = y;
  }
}
