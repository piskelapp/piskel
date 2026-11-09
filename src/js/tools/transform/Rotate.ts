import type { Frame } from "../../model/Frame";
import type { TooltipDescriptor } from "../../utils/TooltipFormatter";
import { AbstractTransformTool } from "./AbstractTransformTool";
import { TransformUtils } from "./TransformUtils";

export class Rotate extends AbstractTransformTool {
  tooltipDescriptors: TooltipDescriptor[];

  constructor() {
    super();
    this.toolId = "tool-rotate";
    this.helpText = "Counter-clockwise rotation";
    this.tooltipDescriptors = [
      { key: "alt", description: "Clockwise rotation" },
      { key: "ctrl", description: "Apply to all layers" },
      { key: "shift", description: "Apply to all frames" }
    ];
  }

  applyToolOnFrame_(frame: Frame, altKey: boolean): void {
    let direction;

    if (altKey) {
      direction = TransformUtils.CLOCKWISE;
    } else {
      direction = TransformUtils.COUNTERCLOCKWISE;
    }

    TransformUtils.rotate(frame, direction);
  }
}
