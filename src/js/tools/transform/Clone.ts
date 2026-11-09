import { app } from "../../app";
import type { Frame } from "../../model/Frame";
import type { TooltipDescriptor } from "../../utils/TooltipFormatter";
import { assertDefined } from "../../utils/core";
import { AbstractTransformTool } from "./AbstractTransformTool";

export class Clone extends AbstractTransformTool {
  tooltipDescriptors: TooltipDescriptor[];

  constructor() {
    super();
    this.toolId = "tool-clone";
    this.helpText = "Clone current layer to all frames";
    this.tooltipDescriptors = [];
  }

  applyTool_(altKey: boolean, allFrames: boolean, allLayers: boolean): void {
    const ref = assertDefined(
      app.piskelController,
      "piskelController"
    ).getCurrentFrame();
    const layer = assertDefined(
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
