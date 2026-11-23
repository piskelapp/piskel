import { Dom } from "@/utils/Dom";
import { AbstractImportStep } from "./AbstractImportStep";

export class SelectMode extends AbstractImportStep {
  static MODES = {
    REPLACE: "replace",
    MERGE: "merge"
  };

  init(): void {
    super.init();

    const replaceButton = Dom.getElement<HTMLElement>(
      ".import-mode-replace-button",
      this.container
    );
    const mergeButton = Dom.getElement<HTMLElement>(
      ".import-mode-merge-button",
      this.container
    );

    this.addEventListener(replaceButton, "click", this.onReplaceButtonClick_);
    this.addEventListener(mergeButton, "click", this.onMergeButtonClick_);
  }

  onShow(): void {
    super.onShow();
  }

  destroy(): void {
    super.destroy();
  }

  onReplaceButtonClick_(): void {
    this.mergeData.importMode = SelectMode.MODES.REPLACE;
    this.onNextClick();
  }

  onMergeButtonClick_(): void {
    this.mergeData.importMode = SelectMode.MODES.MERGE;
    this.onNextClick();
  }
}
