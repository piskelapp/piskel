import { Constants } from "../../Constants";
import { Shortcuts } from "../../service/keyboard/Shortcuts";
import { SimplePen } from "./SimplePen";

export class Eraser extends SimplePen {
  constructor() {
    super();

    this.toolId = "tool-eraser";
    this.helpText = "Eraser tool";
    this.shortcut = Shortcuts.TOOL.ERASER;
  }

  /**
   * @override
   */
  getToolColor(): string {
    return Constants.TRANSPARENT_COLOR;
  }
}
