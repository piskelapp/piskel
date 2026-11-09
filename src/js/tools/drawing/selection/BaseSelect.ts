import { Constants } from "../../../Constants";
import { Events } from "../../../Events";
import { app } from "../../../app";
import type { Frame } from "../../../model/Frame";
import type {
  BaseSelection,
  SelectionPixel
} from "../../../selection/BaseSelection";
import { FunctionUtils } from "../../../utils/FunctionUtils";
import type { TooltipDescriptor } from "../../../utils/TooltipFormatter";
import { assertDefined, intToColor } from "../../../utils/core";
import { BaseTool } from "../BaseTool";
import { Move } from "../Move";

const transparentVariantMemo = FunctionUtils.memo(function (colorStr: string) {
  let color = window.tinycolor(colorStr);
  color = window.tinycolor.lighten(color, 10);
  color.setAlpha(0.5);
  return color.toRgbString();
}, {});

export class BaseSelect extends BaseTool {
  secondaryToolId: string;
  startCol: number | null;
  startRow: number | null;
  lastMoveCol: number | null;
  lastMoveRow: number | null;
  selection: BaseSelection | null;
  hasSelection: boolean;
  tooltipDescriptors: TooltipDescriptor[];
  mode: string | undefined;
  isMovingContent_: boolean | undefined;

  constructor() {
    super();
    this.secondaryToolId = Move.TOOL_ID;

    // Select's first point coordinates (set in applyToolAt)
    this.startCol = null;
    this.startRow = null;

    this.lastMoveCol = null;
    this.lastMoveRow = null;

    this.selection = null;
    this.hasSelection = false;

    this.tooltipDescriptors = [
      {
        description:
          "Drag the selection to move it. You may switch to other layers and frames."
      },
      { key: "ctrl+c", description: "Copy the selected area" },
      { key: "ctrl+v", description: "Paste the copied area" },
      { key: "shift", description: "Hold to move the content" }
    ];

    $.subscribe(
      Events.SELECTION_DISMISSED,
      this.onSelectionDismissed_.bind(this)
    );
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
    this.startCol = col;
    this.startRow = row;

    this.lastMoveCol = col;
    this.lastMoveRow = row;

    // The select tool can be in two different state.
    // If the initial click of the tool is not on a selection, we go in 'select'
    // mode to create a selection.
    // If the initial click is on a previous selection, we go in 'moveSelection'
    // mode to allow to move the selection by drag'n dropping it.
    if (!this.isInSelection(col, row)) {
      this.mode = "select";
      this.onSelectStart_(col, row, frame, overlay);
    } else {
      this.mode = "moveSelection";
      if (event.shiftKey && !this.isMovingContent_) {
        this.isMovingContent_ = true;
        $.publish(Events.CLIPBOARD_CUT);
        this.drawSelectionOnOverlay_(overlay);
      }
      this.onSelectionMoveStart_(col, row, frame, overlay);
    }
  }

  /**
   * @override
   */
  moveToolAt(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame,
    event: MouseEvent
  ): void {
    if (this.mode == "select") {
      this.onSelect_(col, row, frame, overlay);
    } else if (this.mode == "moveSelection") {
      this.onSelectionMove_(col, row, frame, overlay);
    }
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
    if (this.mode == "select") {
      this.onSelectEnd_(col, row, frame, overlay);
    } else if (this.mode == "moveSelection") {
      this.onSelectionMoveEnd_(col, row, frame, overlay);
    }
  }

  /**
   * If we mouseover the selection draw inside the overlay frame, show the 'move' cursor
   * instead of the 'select' one. It indicates that we can move the selection by dragndroping it.
   * @override
   */
  moveUnactiveToolAt(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame,
    event: MouseEvent
  ): void {
    if (overlay.containsPixel(col, row)) {
      if (this.isInSelection(col, row)) {
        // We're hovering the selection, show the move tool:
        document.body.classList.add(this.secondaryToolId);
        document.body.classList.remove(assertDefined(this.toolId, "toolId"));
      } else {
        // We're not hovering the selection, show create selection tool:
        document.body.classList.add(assertDefined(this.toolId, "toolId"));
        document.body.classList.remove(this.secondaryToolId);
      }
    }

    if (!this.hasSelection) {
      super.moveUnactiveToolAt(col, row, frame, overlay, event);
    }
  }

  isInSelection(col: number, row: number): boolean | null {
    return (
      this.selection &&
      this.selection.pixels.some(function (pixel: SelectionPixel) {
        return pixel.col === col && pixel.row === row;
      })
    );
  }

  /**
   * Protected method, should be called when the selection is committed,
   * typically by clicking outside of the selected area.
   */
  commitSelection(): void {
    if (this.isMovingContent_) {
      $.publish(Events.CLIPBOARD_PASTE);
      this.isMovingContent_ = false;
    }

    // Clean previous selection:
    $.publish(Events.SELECTION_DISMISSED);
  }

  /**
   * Protected method, should be called when the selection is dismissed.
   */
  onSelectionDismissed_(): void {
    const overlay = assertDefined(
      app.drawingController,
      "drawingController"
    ).overlayFrame;
    overlay.clear();
    this.hasSelection = false;
  }

  /**
   * For each pixel in the selection draw it in white transparent on the tool overlay
   * @protected
   */
  drawSelectionOnOverlay_(overlay: Frame): void {
    const pixels = assertDefined(this.selection, "selection").pixels;
    for (let i = 0, l = pixels.length; i < l; i++) {
      const pixel = pixels[i];
      const hasColor =
        pixel.color && pixel.color !== Constants.TRANSPARENT_COLOR;
      const color = hasColor
        ? this.getTransparentVariant_(
            intToColor(assertDefined(pixel.color, "color"))
          )
        : Constants.SELECTION_TRANSPARENT_COLOR;

      overlay.setPixel(pixels[i].col, pixels[i].row, color);
    }
  }

  getTransparentVariant_(colorStr: string): string {
    return transparentVariantMemo(colorStr);
  }

  // The list of callbacks to implement by specialized tools to implement the selection creation behavior.
  /** @protected */
  onSelectStart_(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame
  ): void {}

  /** @protected */
  onSelect_(col: number, row: number, frame: Frame, overlay: Frame): void {}

  /** @protected */
  onSelectEnd_(col: number, row: number, frame: Frame, overlay: Frame): void {}

  // The list of callbacks that define the drag'n drop behavior of the selection.
  /** @private */

  onSelectionMoveStart_(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame
  ): void {}

  /** @private */
  onSelectionMove_(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame
  ): void {
    const deltaCol = col - Number(this.lastMoveCol);
    const deltaRow = row - Number(this.lastMoveRow);

    assertDefined(this.selection, "selection").move(deltaCol, deltaRow);

    overlay.clear();
    this.drawSelectionOnOverlay_(overlay);

    this.lastMoveCol = col;
    this.lastMoveRow = row;
  }

  /** @private */
  onSelectionMoveEnd_(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame
  ): void {
    this.onSelectionMove_(col, row, frame, overlay);
  }
}
