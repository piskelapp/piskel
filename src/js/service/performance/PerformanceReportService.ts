import { Events } from "../../Events";
import type { PublicPiskelController } from "../../controller/piskel/PublicPiskelController";
import type { CurrentColorsService } from "../CurrentColorsService";
import { PerformanceReport } from "./PerformanceReport";

export class PerformanceReportService {
  piskelController: PublicPiskelController;
  currentColorsService: CurrentColorsService;
  currentReport: PerformanceReport | null;

  constructor(
    piskelController: PublicPiskelController,
    currentColorsService: CurrentColorsService
  ) {
    this.piskelController = piskelController;
    this.currentColorsService = currentColorsService;

    this.currentReport = null;
  }

  init(): void {
    $.subscribe(Events.HISTORY_STATE_SAVED, this.createReport_.bind(this));
  }

  createReport_(): void {
    const report = new PerformanceReport(
      this.piskelController.getPiskel(),
      this.currentColorsService.getCurrentColors().length
    );

    if (!report.equals(this.currentReport)) {
      $.publish(Events.PERFORMANCE_REPORT_CHANGED, [report]);
      this.currentReport = report;
    }
  }

  hasProblem(): boolean | null {
    return this.currentReport && this.currentReport.hasProblem();
  }
}
