import { Constants } from "../../Constants";
import { Events } from "../../Events";
import { app } from "../../app";
import type { Frame } from "../../model/Frame";
import type { TooltipDescriptor } from "../../utils/TooltipFormatter";
import { assertDefined } from "../../utils/core";
import { BaseTool } from "./BaseTool";

/**
 * Abstract shape tool class, parent to all shape tools (rectangle, circle).
 * Shape tools should override only the draw method
 */
export type ShapeReplayData = {
  startCol: number | null;
  startRow: number | null;
  col: number;
  row: number;
  color: string | number;
  penSize: number;
};

export class ShapeTool extends BaseTool {
  startCol: number | null;
  startRow: number | null;
  tooltipDescriptors: TooltipDescriptor[];

  constructor() {
    super();
    // Shapes's first point coordinates (set in applyToolAt)
    this.startCol = null;
    this.startRow = null;

    this.tooltipDescriptors = [
      { key: "shift", description: "Keep 1 to 1 ratio" }
    ];
  }

  supportsDynamicPenSize() {
    return true;
  }

  /**
   * @override
   */
  applyToolAt(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame,
    event: MouseEvent
  ): void {
    $.publish(Events.DRAG_START, [col, row]);
    this.startCol = col;
    this.startRow = row;

    // Drawing the first point of the rectangle in the fake overlay canvas:
    const penSize = assertDefined(
      app.penSizeService,
      "penSizeService"
    ).getPenSize();
    this.draw(col, row, this.getToolColor(), overlay, penSize);
  }

  moveToolAt(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame,
    event: MouseEvent
  ): void {
    const coords = this.getCoordinates_(col, row, event);
    $.publish(Events.CURSOR_MOVED, [coords.col, coords.row]);

    overlay.clear();
    let color = this.getToolColor();
    if (color == Constants.TRANSPARENT_COLOR) {
      color = Constants.SELECTION_TRANSPARENT_COLOR;
    }

    // draw in overlay
    const penSize = assertDefined(
      app.penSizeService,
      "penSizeService"
    ).getPenSize();
    this.draw(coords.col, coords.row, color, overlay, penSize);
  }

  /**
   * @override
   */
  releaseToolAt(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame,
    event: MouseEvent
  ): void {
    overlay.clear();
    const coords = this.getCoordinates_(col, row, event);
    const color = this.getToolColor();
    const penSize = assertDefined(
      app.penSizeService,
      "penSizeService"
    ).getPenSize();
    this.draw(coords.col, coords.row, color, frame, penSize);

    $.publish(Events.DRAG_END);
    this.raiseSaveStateEvent({
      col: coords.col,
      row: coords.row,
      startCol: this.startCol,
      startRow: this.startRow,
      color: color,
      penSize: penSize
    });
  }

  /**
   * @override
   */
  replay(frame: Frame, replayData: ShapeReplayData): void {
    this.startCol = replayData.startCol;
    this.startRow = replayData.startRow;
    this.draw(
      replayData.col,
      replayData.row,
      replayData.color,
      frame,
      replayData.penSize
    );
  }

  /**
   * Transform the current coordinates based on the original event
   * @param {Number} col current col/x coordinate in the frame
   * @param {Number} row current row/y coordinate in the frame
   * @param {Event} event current event (can be mousemove, mouseup ...)
   * @return {Object} {row : Number, col : Number}
   */
  getCoordinates_(
    col: number,
    row: number,
    event: MouseEvent
  ): { col: number; row: number } {
    if (event.shiftKey) {
      return this.getScaledCoordinates_(col, row);
    } else {
      return { col: col, row: row };
    }
  }

  /**
   * Transform the coordinates to preserve a square 1:1 ratio from the origin of the shape
   * @param {Number} col current col/x coordinate in the frame
   * @param {Number} row current row/y coordinate in the frame
   * @return {Object} {row : Number, col : Number}
   */
  getScaledCoordinates_(
    col: number,
    row: number
  ): { col: number; row: number } {
    const startCol = Number(this.startCol);
    const startRow = Number(this.startRow);
    const dX = startCol - col;
    const absX = Math.abs(dX);

    const dY = startRow - row;
    const absY = Math.abs(dY);

    const delta = Math.min(absX, absY);
    row = startRow - (dY / absY) * delta;
    col = startCol - (dX / absX) * delta;

    return {
      col: col,
      row: row
    };
  }

  draw(
    col: number,
    row: number,
    color: string | number,
    targetFrame: Frame,
    penSize: number
  ): void {
    return Constants.ABSTRACT_FUNCTION();
  }
}
