import { Events } from "../Events";
import type { SavedStatusService } from "../service/SavedStatusService";
import type { PublicPiskelController } from "./piskel/PublicPiskelController";

/**
 * When embedded in piskelapp.com, the page adds a header containing the name of the currently edited sprite
 * This controller will keep the displayed name in sync with the actual piskel name
 */
export class HeaderController {
  piskelController: PublicPiskelController;
  savedStatusService: SavedStatusService;
  piskelName_: HTMLElement | null | undefined;

  constructor(
    piskelController: PublicPiskelController,
    savedStatusService: SavedStatusService
  ) {
    this.piskelController = piskelController;
    this.savedStatusService = savedStatusService;
  }

  init(): void {
    this.piskelName_ = document.querySelector<HTMLElement>(".piskel-name");

    $.subscribe(
      Events.BEFORE_SAVING_PISKEL,
      this.onBeforeSavingPiskelEvent_.bind(this)
    );
    $.subscribe(
      Events.AFTER_SAVING_PISKEL,
      this.onAfterSavingPiskelEvent_.bind(this)
    );

    $.subscribe(
      Events.PISKEL_DESCRIPTOR_UPDATED,
      this.updateHeader_.bind(this)
    );
    $.subscribe(Events.PISKEL_RESET, this.updateHeader_.bind(this));
    $.subscribe(
      Events.PISKEL_SAVED_STATUS_UPDATE,
      this.updateHeader_.bind(this)
    );

    this.updateHeader_();
  }

  updateHeader_(): void {
    try {
      let name = this.piskelController.getPiskel().getDescriptor().name;
      if (this.savedStatusService.isDirty()) {
        name = name + " *";
      }

      if (this.piskelName_) {
        this.piskelName_.textContent = name;
      }
    } catch (e) {
      console.warn(
        "Could not update header : " +
          (e instanceof Error ? e.message : String(e))
      );
    }
  }

  onBeforeSavingPiskelEvent_(): void {
    if (!this.piskelName_) {
      return;
    }
    this.piskelName_.classList.add("piskel-name-saving");
  }

  onAfterSavingPiskelEvent_(): void {
    if (!this.piskelName_) {
      return;
    }
    this.piskelName_.classList.remove("piskel-name-saving");
  }
}
