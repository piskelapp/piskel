import { Events, type ProgressInfo, type ProgressUpdate } from "../Events";
import type { JQueryEvent } from "../lib/jquery-1.8.0";
import { Dom } from "../utils/Dom";
import { Template } from "../utils/Template";
import { assertDefined } from "../utils/core";

export class ProgressBarController {
  template: string;
  progressBar: HTMLElement | null;
  progressBarStatus: HTMLElement | null;
  showProgressTimer_: number;

  constructor() {
    this.template = Template.get("progress-bar-template");
    this.progressBar = null;
    this.progressBarStatus = null;

    this.showProgressTimer_ = 0;
  }

  init(): void {
    $.subscribe(Events.SHOW_PROGRESS, this.showProgress_.bind(this));
    $.subscribe(Events.UPDATE_PROGRESS, this.updateProgress_.bind(this));
    $.subscribe(Events.HIDE_PROGRESS, this.hideProgress_.bind(this));
  }

  showProgress_(event: JQueryEvent, progressInfo: ProgressInfo): void {
    this.removeProgressBar_();
    this.showProgressTimer_ = window.setTimeout(
      this.onTimerExpired_.bind(this, progressInfo),
      300
    );
  }

  onTimerExpired_(progressInfo: ProgressInfo): void {
    const progressBarHtml = Template.replace(this.template, {
      name: progressInfo.name,
      status: 0
    });

    const progressBarEl = Template.createFromHTML(progressBarHtml);
    document.body.appendChild(progressBarEl);

    this.progressBar = document.querySelector<HTMLElement>(".progress-bar");
    this.progressBarStatus = Dom.getElement<HTMLElement>(
      ".progress-bar-status"
    );
  }

  updateProgress_(event: JQueryEvent, progressInfo: ProgressUpdate): void {
    if (this.progressBar && this.progressBarStatus) {
      const progress = progressInfo.progress;
      const width = this.progressBar.offsetWidth;
      const progressWidth = width - (Number(progress) * width) / 100;
      this.progressBar.style.backgroundPosition = -progressWidth + "px 0";
      this.progressBarStatus.innerHTML = progress + "%";
    }
  }

  hideProgress_(event: JQueryEvent): void {
    if (this.showProgressTimer_) {
      window.clearTimeout(this.showProgressTimer_);
    }
    this.removeProgressBar_();
  }

  removeProgressBar_(): void {
    const progressBarContainer = document.querySelector(
      ".progress-bar-container"
    );
    if (progressBarContainer) {
      assertDefined(progressBarContainer.parentNode, "parentNode").removeChild(
        progressBarContainer
      );
      this.progressBar = null;
      this.progressBarStatus = null;
    }
  }
}
