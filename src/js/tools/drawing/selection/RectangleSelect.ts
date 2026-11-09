import { Events } from "../../../Events";
import type { Frame } from "../../../model/Frame";
import { RectangularSelection } from "../../../selection/RectangularSelection";
import type { Shortcut } from "../../../service/keyboard/Shortcut";
import { Shortcuts } from "../../../service/keyboard/Shortcuts";
import { AbstractDragSelect } from "./AbstractDragSelect";

export class RectangleSelect extends AbstractDragSelect {
  shortcut: Shortcut;

  constructor() {
    super();

    this.toolId = "tool-rectangle-select";
    this.helpText = "Rectangle selection";
    this.shortcut = Shortcuts.TOOL.RECTANGLE_SELECT;
  }

  /** @override */
  onDragSelectStart_(col: number, row: number): void {
    $.publish(Events.DRAG_START, [col, row]);
  }

  /**
   * When creating the rectangle selection, we clear the current overlayFrame and
   * redraw the current rectangle based on the origin coordinate and
   * the current mouse coordinate in sprite.
   * @override
   */
  onDragSelect_(col: number, row: number, frame: Frame, overlay: Frame): void {
    overlay.clear();
    this.selection = new RectangularSelection(
      Number(this.startCol),
      Number(this.startRow),
      col,
      row
    );
    $.publish(Events.SELECTION_CREATED, [this.selection]);
    this.drawSelectionOnOverlay_(overlay);
  }

  /** @override */
  onDragSelectEnd_(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame
  ): void {
    this.onSelect_(col, row, frame, overlay);
    $.publish(Events.DRAG_END);
  }
}
