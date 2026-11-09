import { app } from "../../app";
import type { Frame } from "../../model/Frame";
import type { Layer } from "../../model/Layer";
import type { Shortcut } from "../../service/keyboard/Shortcut";
import { Shortcuts } from "../../service/keyboard/Shortcuts";
import type { TooltipDescriptor } from "../../utils/TooltipFormatter";
import { UserAgent } from "../../utils/UserAgent";
import { assertDefined, colorToInt } from "../../utils/core";
import { BaseTool } from "./BaseTool";

export class ColorSwap extends BaseTool {
  shortcut: Shortcut;
  tooltipDescriptors: TooltipDescriptor[];

  constructor() {
    super();
    this.toolId = "tool-colorswap";
    this.helpText = "Paint all pixels of the same color";
    this.shortcut = Shortcuts.TOOL.COLORSWAP;

    this.tooltipDescriptors = [
      { key: "ctrl", description: "Apply to all layers" },
      { key: "shift", description: "Apply to all frames" }
    ];
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
      const oldColor = assertDefined(frame.getPixel(col, row), "oldColor");
      const newColor = this.getToolColor();

      const allLayers = UserAgent.isMac ? event.metaKey : event.ctrlKey;
      const allFrames = event.shiftKey;
      this.swapColors_(oldColor, newColor, allLayers, allFrames);

      this.raiseSaveStateEvent({
        allLayers: allLayers,
        allFrames: allFrames,
        oldColor: oldColor,
        newColor: newColor
      });
    }
  }

  replay(
    frame: Frame,
    replayData: {
      oldColor: string | number;
      newColor: string | number;
      allLayers: boolean;
      allFrames: boolean;
    }
  ): void {
    this.swapColors_(
      replayData.oldColor,
      replayData.newColor,
      replayData.allLayers,
      replayData.allFrames
    );
  }

  swapColors_(
    oldColor: string | number,
    newColor: string | number,
    allLayers: boolean,
    allFrames: boolean
  ): void {
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
        this.applyToolOnFrame_(frame, oldColor, newColor);
      });
    });
  }

  applyToolOnFrame_(
    frame: Frame,
    oldColor: string | number,
    newColor: string | number
  ): void {
    oldColor = colorToInt(oldColor);
    newColor = colorToInt(newColor);
    frame.forEachPixel(function (color: number, col: number, row: number) {
      if (color !== null && color == oldColor) {
        frame.setPixel(col, row, newColor);
      }
    });
  }
}
