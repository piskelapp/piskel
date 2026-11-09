import type { Frame } from "../../model/Frame";
import type { TooltipDescriptor } from "../../utils/TooltipFormatter";
import { AbstractTransformTool } from "./AbstractTransformTool";
import { TransformUtils } from "./TransformUtils";

export class Center extends AbstractTransformTool {
  tooltipDescriptors: TooltipDescriptor[];

  constructor() {
    super();
    this.toolId = "tool-center";
    this.helpText = "Align image to the center";
    this.tooltipDescriptors = [
      { key: "ctrl", description: "Apply to all layers" },
      { key: "shift", description: "Apply to all frames" }
    ];
  }

  applyToolOnFrame_(frame: Frame): void {
    TransformUtils.center(frame);
  }
}
