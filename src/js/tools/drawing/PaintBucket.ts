import type { Frame } from "../../model/Frame";
import type { Shortcut } from "../../service/keyboard/Shortcut";
import { Shortcuts } from "../../service/keyboard/Shortcuts";
import { PixelUtils } from "../../utils/PixelUtils";
import { BaseTool } from "./BaseTool";

export class PaintBucket extends BaseTool {
  shortcut: Shortcut;

  constructor() {
    super();
    this.toolId = "tool-paint-bucket";
    this.helpText = "Paint bucket tool";
    this.shortcut = Shortcuts.TOOL.PAINT_BUCKET;
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
    const color = this.getToolColor();
    PixelUtils.paintSimilarConnectedPixelsFromFrame(frame, col, row, color);

    this.raiseSaveStateEvent({
      col: col,
      row: row,
      color: color
    });
  }

  replay(
    frame: Frame,
    replayData: { col: number; row: number; color: string | number }
  ): void {
    PixelUtils.paintSimilarConnectedPixelsFromFrame(
      frame,
      replayData.col,
      replayData.row,
      replayData.color
    );
  }
}
