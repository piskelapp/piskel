import { Dom } from "@/utils/Dom";
import { assertInitialized } from "@/utils/core";
import { FramePicker } from "@/widgets/FramePicker";
import { AbstractImportStep } from "./AbstractImportStep";

export class InsertLocation extends AbstractImportStep {
  framePreview: HTMLElement | undefined;
  currentPiskelFramePickerWidget: FramePicker | undefined;
  insertModeContainer: HTMLElement | undefined;

  static MODES = {
    ADD: "add",
    INSERT: "insert"
  };

  init(): void {
    super.init();
    this.framePreview = Dom.getElement<HTMLElement>(
      ".insert-frame-preview",
      this.container
    );
    this.currentPiskelFramePickerWidget = new FramePicker(
      this.piskelController.getPiskel(),
      this.framePreview
    );

    this.insertModeContainer = Dom.getElement<HTMLElement>(
      ".insert-mode-container",
      this.container
    );
    this.addEventListener(
      this.insertModeContainer,
      "change",
      this.onInsertModeChange_
    );
    this.mergeData.insertMode = InsertLocation.MODES.ADD;
  }

  onInsertModeChange_(): void {
    const value = Dom.getElement<HTMLInputElement>(
      ":checked",
      this.insertModeContainer
    ).value;
    this.mergeData.insertMode = value;

    if (this.mergeData.insertMode === InsertLocation.MODES.ADD) {
      assertInitialized(
        this.currentPiskelFramePickerWidget,
        "currentPiskelFramePickerWidget"
      ).setFirstFrameIndex(0);
    } else {
      assertInitialized(
        this.currentPiskelFramePickerWidget,
        "currentPiskelFramePickerWidget"
      ).setFirstFrameIndex(1);
    }
  }

  onShow(): void {
    // Initialize the frame picker on show, to be able to calculate correctly the
    // container's offsetWidth and offsetHeight.
    assertInitialized(
      this.currentPiskelFramePickerWidget,
      "currentPiskelFramePickerWidget"
    ).init();

    const currentFrameIndex = this.piskelController.getCurrentFrameIndex();
    assertInitialized(
      this.currentPiskelFramePickerWidget,
      "currentPiskelFramePickerWidget"
    ).setFrameIndex(currentFrameIndex + 1);
    assertInitialized(
      this.currentPiskelFramePickerWidget,
      "currentPiskelFramePickerWidget"
    ).setFirstFrameIndex(0);

    super.onShow();
  }

  onNextClick(): void {
    const insertIndex = assertInitialized(
      this.currentPiskelFramePickerWidget,
      "currentPiskelFramePickerWidget"
    ).getFrameIndex();
    this.mergeData.insertIndex = insertIndex;
    super.onNextClick();
  }

  destroy(): void {
    assertInitialized(
      this.currentPiskelFramePickerWidget,
      "currentPiskelFramePickerWidget"
    ).destroy();
    super.destroy();
  }
}
