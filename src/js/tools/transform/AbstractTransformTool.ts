import { Events } from "@/Events";
import { app } from "@/app";
import type { Frame } from "@/model/Frame";
import type { Layer } from "@/model/Layer";
import { UserAgent } from "@/utils/UserAgent";
import { assertInitialized } from "@/utils/core";
import { Tool } from "@/tools/Tool";

export abstract class AbstractTransformTool extends Tool {
  abstract applyToolOnFrame_(frame: Frame, altKey?: boolean): void;

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
    const currentFrameIndex = assertInitialized(
      app.piskelController,
      "piskelController"
    ).getCurrentFrameIndex();
    const layers = allLayers
      ? assertInitialized(app.piskelController, "piskelController").getLayers()
      : [
          assertInitialized(
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
    _frame: Frame,
    replayData: { altKey: boolean; allFrames: boolean; allLayers: boolean }
  ): void {
    this.applyTool_(
      replayData.altKey,
      replayData.allFrames,
      replayData.allLayers
    );
  }
}
