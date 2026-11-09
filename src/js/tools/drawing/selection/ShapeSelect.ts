import { Events } from "../../../Events";
import type { Frame } from "../../../model/Frame";
import { ShapeSelection } from "../../../selection/ShapeSelection";
import type { Shortcut } from "../../../service/keyboard/Shortcut";
import { Shortcuts } from "../../../service/keyboard/Shortcuts";
import { PixelUtils } from "../../../utils/PixelUtils";
import { BaseSelect } from "./BaseSelect";

export class ShapeSelect extends BaseSelect {
  shortcut: Shortcut;

  constructor() {
    super();

    this.toolId = "tool-shape-select";
    this.helpText = "Shape selection";
    this.shortcut = Shortcuts.TOOL.SHAPE_SELECT;
  }

  /**
   * For the shape select tool, you just need to click one time to create a selection.
   * So we just need to implement onSelectStart_ (no need for onSelect_ & onSelectEnd_)
   * @override
   */
  onSelectStart_(col: number, row: number, frame: Frame, overlay: Frame): void {
    if (this.hasSelection) {
      this.hasSelection = false;
      this.commitSelection();
    } else {
      this.hasSelection = true;
      // From the pixel clicked, get shape using an algorithm similar to the paintbucket one:
      const pixels = PixelUtils.getSimilarConnectedPixelsFromFrame(
        frame,
        col,
        row
      );
      this.selection = new ShapeSelection(pixels);

      $.publish(Events.SELECTION_CREATED, [this.selection]);
      this.drawSelectionOnOverlay_(overlay);
    }
  }
}
