import { Events, type Replayable } from "@/Events";
import { HistoryService } from "@/service/HistoryService";
import type { Shortcut } from "@/service/keyboard/Shortcut";
import type { TooltipDescriptor } from "@/utils/TooltipFormatter";

export abstract class Tool {
  toolId: string | undefined;
  helpText: string | undefined;
  shortcut: Shortcut | undefined;
  tooltipDescriptors: TooltipDescriptor[] | undefined;

  getHelpText(): string | undefined {
    return this.helpText;
  }

  getId(): string | undefined {
    return this.toolId;
  }

  /**
   * Records an action in the history. Only tools that can replay their
   * actions record them, so this requires a `replay` method.
   */
  raiseSaveStateEvent(this: Tool & Replayable, replayData: unknown): void {
    $.publish(Events.PISKEL_SAVE_STATE, {
      type: HistoryService.REPLAY,
      scope: this,
      replay: replayData
    });
  }
}
