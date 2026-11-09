import { Dom } from "../../../../utils/Dom";
import { assertDefined } from "../../../../utils/core";
import { FramePicker } from "../../../../widgets/FramePicker";
import type { PublicPiskelController } from "../../../piskel/PublicPiskelController";
import type { ImportWizard } from "../ImportWizard";
import { AbstractImportStep } from "./AbstractImportStep";

export class InsertLocation extends AbstractImportStep {
  framePreview: HTMLElement | undefined;
  currentPiskelFramePickerWidget: FramePicker | undefined;
  insertModeContainer: HTMLElement | undefined;

  constructor(
    piskelController: PublicPiskelController,
    importController: ImportWizard,
    container: HTMLElement
  ) {
    super(piskelController, importController, container);
  }

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
      assertDefined(
        this.currentPiskelFramePickerWidget,
        "currentPiskelFramePickerWidget"
      ).setFirstFrameIndex(0);
    } else {
      assertDefined(
        this.currentPiskelFramePickerWidget,
        "currentPiskelFramePickerWidget"
      ).setFirstFrameIndex(1);
    }
  }

  onShow(): void {
    // Initialize the frame picker on show, to be able to calculate correctly the
    // container's offsetWidth and offsetHeight.
    assertDefined(
      this.currentPiskelFramePickerWidget,
      "currentPiskelFramePickerWidget"
    ).init();

    const currentFrameIndex = this.piskelController.getCurrentFrameIndex();
    assertDefined(
      this.currentPiskelFramePickerWidget,
      "currentPiskelFramePickerWidget"
    ).setFrameIndex(currentFrameIndex + 1);
    assertDefined(
      this.currentPiskelFramePickerWidget,
      "currentPiskelFramePickerWidget"
    ).setFirstFrameIndex(0);

    super.onShow();
  }

  onNextClick(): void {
    const insertIndex = assertDefined(
      this.currentPiskelFramePickerWidget,
      "currentPiskelFramePickerWidget"
    ).getFrameIndex();
    this.mergeData.insertIndex = insertIndex;
    super.onNextClick();
  }

  destroy(): void {
    assertDefined(
      this.currentPiskelFramePickerWidget,
      "currentPiskelFramePickerWidget"
    ).destroy();
    super.destroy();
  }
}
