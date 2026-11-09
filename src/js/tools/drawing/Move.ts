import { Constants } from "../../Constants";
import type { Frame } from "../../model/Frame";
import type { Shortcut } from "../../service/keyboard/Shortcut";
import { Shortcuts } from "../../service/keyboard/Shortcuts";
import type { TooltipDescriptor } from "../../utils/TooltipFormatter";
import { UserAgent } from "../../utils/UserAgent";
import { assertDefined } from "../../utils/core";
import { ToolsHelper } from "../ToolsHelper";
import { BaseTool } from "./BaseTool";

export class Move extends BaseTool {
  shortcut: Shortcut;
  tooltipDescriptors: TooltipDescriptor[];
  startCol: number | null;
  startRow: number | null;
  currentFrame: Frame | undefined;
  currentFrameClone: Frame | undefined;

  constructor() {
    super();
    this.toolId = Move.TOOL_ID;
    this.helpText = "Move tool";
    this.shortcut = Shortcuts.TOOL.MOVE;

    this.tooltipDescriptors = [
      { key: "ctrl", description: "Apply to all layers" },
      { key: "shift", description: "Apply to all frames" },
      { key: "alt", description: "Wrap canvas borders" }
    ];

    // Stroke's first point coordinates (set in applyToolAt)
    this.startCol = null;
    this.startRow = null;
  }

  /**
   * The move tool id is used by the ToolController and the BaseSelect and needs to be
   * easliy accessible
   */
  static TOOL_ID = "tool-move";

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
    this.startCol = col;
    this.startRow = row;
    this.currentFrame = frame;
    this.currentFrameClone = frame.clone();
  }

  moveToolAt(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame,
    event: MouseEvent
  ): void {
    const colDiff = col - Number(this.startCol);
    const rowDiff = row - Number(this.startRow);
    this.shiftFrame(
      colDiff,
      rowDiff,
      frame,
      assertDefined(this.currentFrameClone, "currentFrameClone"),
      event
    );
  }

  shiftFrame(
    colDiff: number,
    rowDiff: number,
    frame: Frame,
    reference: Frame,
    event: { altKey: boolean }
  ): void {
    let color: string | number;
    const w = frame.getWidth();
    const h = frame.getHeight();
    for (let col = 0; col < w; col++) {
      for (let row = 0; row < h; row++) {
        let x = col - colDiff;
        let y = row - rowDiff;
        if (event.altKey) {
          x = (x + w) % w;
          y = (y + h) % h;
        }
        if (reference.containsPixel(x, y)) {
          color = assertDefined(reference.getPixel(x, y), "color");
        } else {
          color = Constants.TRANSPARENT_COLOR;
        }
        frame.setPixel(col, row, color);
      }
    }
  }

  /**
   * @override
   */
  releaseToolAt(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame,
    event: MouseEvent
  ): void {
    const colDiff = col - Number(this.startCol);
    const rowDiff = row - Number(this.startRow);

    const ctrlKey = UserAgent.isMac ? event.metaKey : event.ctrlKey;
    ToolsHelper.getTargetFrames(ctrlKey, event.shiftKey).forEach((f) => {
      // for the current frame, the backup clone should be reused as reference
      // the current frame has been modified by the user action already
      const reference =
        this.currentFrame == f
          ? assertDefined(this.currentFrameClone, "currentFrameClone")
          : f.clone();
      this.shiftFrame(colDiff, rowDiff, f, reference, event);
    });

    this.raiseSaveStateEvent({
      colDiff: colDiff,
      rowDiff: rowDiff,
      ctrlKey: ctrlKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey
    });
  }

  replay(
    frame: Frame,
    replayData: {
      colDiff: number;
      rowDiff: number;
      ctrlKey: boolean;
      altKey: boolean;
      shiftKey: boolean;
    }
  ): void {
    const event = {
      shiftKey: replayData.shiftKey,
      altKey: replayData.altKey,
      ctrlKey: replayData.ctrlKey
    };
    ToolsHelper.getTargetFrames(event.ctrlKey, event.shiftKey).forEach(
      (frame: Frame) => {
        this.shiftFrame(
          replayData.colDiff,
          replayData.rowDiff,
          frame,
          frame.clone(),
          event
        );
      }
    );
  }

  supportsAlt() {
    return true;
  }
}
