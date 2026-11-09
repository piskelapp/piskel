import { Constants } from "../Constants";
import { Events } from "../Events";
import type { Frame } from "../model/Frame";
import { HistoryService } from "../service/HistoryService";
import type { Shortcut } from "../service/keyboard/Shortcut";
import type { TooltipDescriptor } from "../utils/TooltipFormatter";

export class Tool {
  toolId: string | undefined;
  helpText: string | undefined;
  shortcut: Shortcut | undefined;
  tooltipDescriptors: TooltipDescriptor[] | undefined;

  /** Applies a recorded action, implemented by each tool. */
  replay(frame: Frame, replayData: unknown): void {
    return Constants.ABSTRACT_FUNCTION();
  }

  getHelpText(): string | undefined {
    return this.helpText;
  }

  getId(): string | undefined {
    return this.toolId;
  }

  raiseSaveStateEvent(replayData: unknown): void {
    $.publish(Events.PISKEL_SAVE_STATE, {
      type: HistoryService.REPLAY,
      scope: this,
      replay: replayData
    });
  }
}
