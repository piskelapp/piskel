import type { Frame } from "../../model/Frame";
import type { TooltipDescriptor } from "../../utils/TooltipFormatter";
import { AbstractTransformTool } from "./AbstractTransformTool";
import { TransformUtils } from "./TransformUtils";

export class Flip extends AbstractTransformTool {
  tooltipDescriptors: TooltipDescriptor[];

  constructor() {
    super();
    this.toolId = "tool-flip";
    this.helpText = "Flip horizontally";
    this.tooltipDescriptors = [
      { key: "alt", description: "Flip vertically" },
      { key: "ctrl", description: "Apply to all layers" },
      { key: "shift", description: "Apply to all frames" }
    ];
  }

  applyToolOnFrame_(frame: Frame, altKey: boolean): void {
    let axis;

    if (altKey) {
      axis = TransformUtils.HORIZONTAL;
    } else {
      axis = TransformUtils.VERTICAL;
    }

    TransformUtils.flip(frame, axis);
  }
}
