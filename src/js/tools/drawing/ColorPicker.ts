import { Events } from "../../Events";
import { app } from "../../app";
import type { Frame } from "../../model/Frame";
import type { Shortcut } from "../../service/keyboard/Shortcut";
import { Shortcuts } from "../../service/keyboard/Shortcuts";
import { assertDefined, intToColor } from "../../utils/core";
import { BaseTool } from "./BaseTool";

export class ColorPicker extends BaseTool {
  shortcut: Shortcut;

  constructor() {
    super();
    this.toolId = "tool-colorpicker";
    this.helpText = "Color picker";
    this.shortcut = Shortcuts.TOOL.COLORPICKER;
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
    if (frame.containsPixel(col, row)) {
      const sampledColor = intToColor(frame.getPixel(col, row));
      if (
        assertDefined(
          app.mouseStateService,
          "mouseStateService"
        ).isLeftButtonPressed()
      ) {
        $.publish(Events.SELECT_PRIMARY_COLOR, [sampledColor]);
      } else if (
        assertDefined(
          app.mouseStateService,
          "mouseStateService"
        ).isRightButtonPressed()
      ) {
        $.publish(Events.SELECT_SECONDARY_COLOR, [sampledColor]);
      }
    }
  }
}
