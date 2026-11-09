import { app } from "../../app";
import type { Frame } from "../../model/Frame";
import { Shortcuts } from "../../service/keyboard/Shortcuts";
import type { TooltipDescriptor } from "../../utils/TooltipFormatter";
import { UserAgent } from "../../utils/UserAgent";
import { assertDefined } from "../../utils/core";
import { SimplePen } from "./SimplePen";

export class VerticalMirrorPen extends SimplePen {
  tooltipDescriptors: TooltipDescriptor[];

  constructor() {
    super();

    this.toolId = "tool-vertical-mirror-pen";
    this.helpText = "Vertical Mirror pen";
    this.shortcut = Shortcuts.TOOL.MIRROR_PEN;

    this.tooltipDescriptors = [
      { key: "ctrl", description: "Use horizontal axis" },
      { key: "shift", description: "Use horizontal and vertical axis" }
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
    const color = this.getToolColor();
    this.drawUsingPenSize(color, col, row, frame, overlay);

    const mirroredCol = this.getSymmetricCol_(col, frame);
    const mirroredRow = this.getSymmetricRow_(row, frame);

    const hasCtrlKey = UserAgent.isMac ? event.metaKey : event.ctrlKey;
    if (!hasCtrlKey) {
      this.drawUsingPenSize(color, mirroredCol, row, frame, overlay);
    }

    if (event.shiftKey || hasCtrlKey) {
      this.drawUsingPenSize(color, col, mirroredRow, frame, overlay);
    }

    if (event.shiftKey) {
      this.drawUsingPenSize(color, mirroredCol, mirroredRow, frame, overlay);
    }

    this.previousCol = col;
    this.previousRow = row;
  }

  getSymmetricCol_(col: number, frame: Frame): number {
    return frame.getWidth() - col - this.getPenSizeOffset_();
  }

  getSymmetricRow_(row: number, frame: Frame): number {
    return frame.getHeight() - row - this.getPenSizeOffset_();
  }

  /**
   * Depending on the pen size, the mirrored index need to have an offset of 1 pixel.
   */
  getPenSizeOffset_(row?: number, frame?: Frame): number {
    return assertDefined(app.penSizeService, "penSizeService").getPenSize() % 2;
  }
}
