import { Events } from "../../../Events";
import type { Frame } from "../../../model/Frame";
import type { BaseSelection } from "../../../selection/BaseSelection";
import { LassoSelection } from "../../../selection/LassoSelection";
import { ShapeSelection } from "../../../selection/ShapeSelection";
import type { Shortcut } from "../../../service/keyboard/Shortcut";
import { Shortcuts } from "../../../service/keyboard/Shortcuts";
import { MathUtils } from "../../../utils/Math";
import { type PixelCoords, PixelUtils } from "../../../utils/PixelUtils";
import { assertDefined } from "../../../utils/core";
import { AbstractDragSelect } from "./AbstractDragSelect";

export class LassoSelect extends AbstractDragSelect {
  shortcut: Shortcut;
  pixels: PixelCoords[] | undefined;
  previousCol: number | undefined;
  previousRow: number | undefined;

  constructor() {
    super();

    this.toolId = "tool-lasso-select";
    this.helpText = "Lasso selection";
    this.shortcut = Shortcuts.TOOL.LASSO_SELECT;
  }

  /** @override */
  onDragSelectStart_(col: number, row: number): void {
    this.pixels = [{ col: col, row: row }];

    this.startCol = col;
    this.startRow = row;

    this.previousCol = col;
    this.previousRow = row;

    $.publish(Events.DRAG_START, [col, row]);
  }

  /** @override */
  onDragSelect_(col: number, row: number, frame: Frame, overlay: Frame): void {
    this.addPixel_(col, row, frame);
    // use ShapeSelection during selection, contains only the pixels hovered by the user
    const selection = new ShapeSelection(this.getLassoPixels_());
    this.setSelection_(selection, overlay);
  }

  /** @override */
  onDragSelectEnd_(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame
  ): void {
    this.addPixel_(col, row, frame);
    // use LassoSelection to finalize selection, includes pixels inside the lasso shape
    const selection = new LassoSelection(this.getLassoPixels_(), frame);
    this.setSelection_(selection, overlay);

    $.publish(Events.DRAG_END);
  }

  /**
   * Retrieve the lasso shape as an array of pixels. A line is added between the origin of the selection
   * and the last known coordinate to make sure the shape is closed.
   *
   * @return {Array} array of pixels corresponding to the whole lasso shape
   * @private
   */
  getLassoPixels_(): PixelCoords[] {
    const line = PixelUtils.getLinePixels(
      Number(this.previousCol),
      Number(this.startCol),
      Number(this.previousRow),
      Number(this.startRow)
    );
    return assertDefined(this.pixels, "pixels").concat(line);
  }

  /**
   * Add the provided pixel to the lasso pixels Array.
   * @private
   */
  addPixel_(col: number, row: number, frame: Frame): void {
    // normalize coordinates to always remain inside the frame
    col = MathUtils.minmax(col, 0, frame.getWidth() - 1);
    row = MathUtils.minmax(row, 0, frame.getHeight() - 1);

    // line interpolation needed in case mousemove was too fast
    const interpolatedPixels = PixelUtils.getLinePixels(
      col,
      Number(this.previousCol),
      row,
      Number(this.previousRow)
    );
    this.pixels = assertDefined(this.pixels, "pixels").concat(
      interpolatedPixels
    );

    // update state
    this.previousCol = col;
    this.previousRow = row;
  }

  /** @private */
  setSelection_(selection: BaseSelection, overlay: Frame): void {
    this.selection = selection;

    $.publish(Events.SELECTION_CREATED, [this.selection]);
    overlay.clear();
    this.drawSelectionOnOverlay_(overlay);
  }
}
