import { Constants } from "../../Constants";
import { Events } from "../../Events";
import { app } from "../../app";
import type { Frame } from "../../model/Frame";
import type { Layer } from "../../model/Layer";
import { UserAgent } from "../../utils/UserAgent";
import { assertDefined } from "../../utils/core";
import { Tool } from "../Tool";

export class AbstractTransformTool extends Tool {
  applyToolOnFrame_(frame: Frame, altKey?: boolean): void {
    return Constants.ABSTRACT_FUNCTION();
  }

  constructor() {
    super();
  }

  applyTransformation(evt: MouseEvent): void {
    const allFrames = evt.shiftKey;
    const allLayers = UserAgent.isMac ? evt.metaKey : evt.ctrlKey;

    this.applyTool_(evt.altKey, allFrames, allLayers);

    $.publish(Events.PISKEL_RESET);

    this.raiseSaveStateEvent({
      altKey: evt.altKey,
      allFrames: allFrames,
      allLayers: allLayers
    });
  }

  applyTool_(altKey: boolean, allFrames: boolean, allLayers: boolean): void {
    const currentFrameIndex = assertDefined(
      app.piskelController,
      "piskelController"
    ).getCurrentFrameIndex();
    const layers = allLayers
      ? assertDefined(app.piskelController, "piskelController").getLayers()
      : [
          assertDefined(
            app.piskelController,
            "piskelController"
          ).getCurrentLayer()
        ];
    layers.forEach((layer: Layer) => {
      const frames = allFrames
        ? layer.getFrames()
        : [layer.getFrameAt(currentFrameIndex)];
      frames.forEach((frame: Frame) => {
        this.applyToolOnFrame_(frame, altKey);
      });
    });
  }

  replay(
    frame: Frame,
    replayData: { altKey: boolean; allFrames: boolean; allLayers: boolean }
  ): void {
    this.applyTool_(
      replayData.altKey,
      replayData.allFrames,
      replayData.allLayers
    );
  }
}
