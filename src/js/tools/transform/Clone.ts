import { app } from "@/app";
import type { Frame } from "@/model/Frame";
import type { TooltipDescriptor } from "@/utils/TooltipFormatter";
import { assertInitialized } from "@/utils/core";
import { AbstractTransformTool } from "./AbstractTransformTool";

export class Clone extends AbstractTransformTool {
  tooltipDescriptors: TooltipDescriptor[];

  constructor() {
    super();
    this.toolId = "tool-clone";
    this.helpText = "Clone current layer to all frames";
    this.tooltipDescriptors = [];
  }

  applyToolOnFrame_(): void {
    throw new Error("Clone copies whole frames in applyTool_");
  }

  applyTool_(): void {
    const ref = assertInitialized(
      app.piskelController,
      "piskelController"
    ).getCurrentFrame();
    const layer = assertInitialized(
      app.piskelController,
      "piskelController"
    ).getCurrentLayer();
    layer.getFrames().forEach(function (frame: Frame) {
      if (frame !== ref) {
        frame.setPixels(ref.getPixels());
      }
    });
  }
}
