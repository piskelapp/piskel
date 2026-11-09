import { Events } from "../Events";
import type { PublicPiskelController } from "../controller/piskel/PublicPiskelController";
import type { HistoryService } from "./HistoryService";

export class SavedStatusService {
  piskelController: PublicPiskelController;
  historyService: HistoryService;
  lastSavedStateIndex: string | false;

  constructor(
    piskelController: PublicPiskelController,
    historyService: HistoryService
  ) {
    this.piskelController = piskelController;
    this.historyService = historyService;
    this.lastSavedStateIndex = "";

    this.publishStatusUpdateEvent_ = this.publishStatusUpdateEvent_.bind(this);
  }

  init(): void {
    $.subscribe(Events.TOOL_RELEASED, this.publishStatusUpdateEvent_);
    $.subscribe(Events.PISKEL_RESET, this.publishStatusUpdateEvent_);
    $.subscribe(Events.PISKEL_SAVED, this.onPiskelSaved.bind(this));
    this.lastSavedStateIndex = this.historyService.getCurrentStateId();
  }

  onPiskelSaved(): void {
    this.lastSavedStateIndex = this.historyService.getCurrentStateId();
    this.publishStatusUpdateEvent_();
  }

  publishStatusUpdateEvent_(): void {
    $.publish(Events.PISKEL_SAVED_STATUS_UPDATE);
  }

  isDirty(): boolean {
    return this.lastSavedStateIndex != this.historyService.getCurrentStateId();
  }
}
