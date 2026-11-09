import { Events } from "../Events";
import type { JQueryEvent } from "../lib/jquery-1.8.0";
import type { CurrentColorsService } from "../service/CurrentColorsService";
import type { PerformanceReport } from "../service/performance/PerformanceReport";
import { Dom } from "../utils/Dom";
import { EventUtils } from "../utils/Event";
import { assertDefined } from "../utils/core";
import type { PublicPiskelController } from "./piskel/PublicPiskelController";

export class UserWarningController {
  piskelController: PublicPiskelController;
  currentColorsService: CurrentColorsService | undefined;
  performanceLinkEl: HTMLElement | null | undefined;

  constructor(
    piskelController: PublicPiskelController,
    currentColorsService?: CurrentColorsService
  ) {
    this.piskelController = piskelController;
    this.currentColorsService = currentColorsService;
  }

  // This method is not attached to the prototype because we want to trigger it
  // from markup generated for a notification message.
  static showPerformanceInfoDialog(): void {
    $.publish(Events.DIALOG_SHOW, {
      dialogId: "performance-info"
    });
  }

  init(): void {
    $.subscribe(
      Events.PERFORMANCE_REPORT_CHANGED,
      this.onPerformanceReportChanged_.bind(this)
    );

    this.performanceLinkEl = Dom.getElement<HTMLElement>(".performance-link");
    EventUtils.addEventListener(
      this.performanceLinkEl,
      "click",
      UserWarningController.showPerformanceInfoDialog,
      this
    );
    EventUtils.addEventListener(
      document.body,
      "click",
      this.onDocumentClick_,
      this
    );
  }

  /** Handles the link of the notification, whose markup is a plain string. */
  onDocumentClick_(evt: Event): void {
    if ((evt.target as HTMLElement).dataset.performanceInfoLink) {
      UserWarningController.showPerformanceInfoDialog();
    }
  }

  destroy(): void {
    EventUtils.removeAllEventListeners(this);
    this.performanceLinkEl = null;
  }

  onPerformanceReportChanged_(
    event: JQueryEvent,
    report: PerformanceReport
  ): void {
    const shouldDisplayWarning = report.hasProblem();

    // Check if a performance warning is already displayed.
    const isWarningDisplayed = assertDefined(
      this.performanceLinkEl,
      "performanceLinkEl"
    ).classList.contains("visible");

    // Show/hide the performance warning link depending on the received report.
    if (shouldDisplayWarning) {
      assertDefined(this.performanceLinkEl, "performanceLinkEl").classList.add(
        "visible"
      );
    } else {
      assertDefined(
        this.performanceLinkEl,
        "performanceLinkEl"
      ).classList.remove("visible");
    }

    // Show a notification message if the new report indicates a performance issue
    // and we were not displaying a warning before.
    if (shouldDisplayWarning && !isWarningDisplayed) {
      $.publish(Events.SHOW_NOTIFICATION, [
        {
          content:
            "Performance problem detected, " +
            '<a href="#" style="color:red;" data-performance-info-link="true">' +
            "learn more?</a>",
          hideDelay: 5000
        }
      ]);
    }
  }
}
