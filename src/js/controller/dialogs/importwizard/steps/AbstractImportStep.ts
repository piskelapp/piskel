import { Dom } from "../../../../utils/Dom";
import { EventUtils, type ListenerCallback } from "../../../../utils/Event";
import { StringUtils } from "../../../../utils/StringUtils";
import { Template } from "../../../../utils/Template";
import { FramePicker } from "../../../../widgets/FramePicker";
import type { PublicPiskelController } from "../../../piskel/PublicPiskelController";
import type { ImportWizard, MergeData } from "../ImportWizard";

export class AbstractImportStep {
  piskelController: PublicPiskelController;
  container: HTMLElement;
  importController: ImportWizard;
  mergeData: MergeData;
  nextButton: HTMLElement | undefined;
  backButton: HTMLElement | undefined;
  framePickerWidget: FramePicker | undefined;

  constructor(
    piskelController: PublicPiskelController,
    importController: ImportWizard,
    container: HTMLElement
  ) {
    this.piskelController = piskelController;
    this.container = container;
    this.importController = importController;
    this.mergeData = this.importController.mergeData;
  }

  init(): void {
    this.nextButton = Dom.getElement<HTMLElement>(
      ".import-next-button",
      this.container
    );
    this.backButton = Dom.getElement<HTMLElement>(
      ".import-back-button",
      this.container
    );

    this.addEventListener(this.nextButton, "click", this.onNextClick);
    this.addEventListener(this.backButton, "click", this.onBackClick);
  }

  addEventListener(
    el: EventTarget | string,
    type: string,
    cb: ListenerCallback
  ): void {
    EventUtils.addEventListener(el, type, cb, this);
  }

  destroy(): void {
    if (this.framePickerWidget) {
      this.framePickerWidget.destroy();
    }

    EventUtils.removeAllEventListeners(this);
  }

  onNextClick(): void {
    this.importController.next();
  }

  onBackClick(): void {
    this.importController.back();
  }

  onShow(): void {
    const mergePiskel = this.mergeData.mergePiskel;
    if (!mergePiskel) {
      return;
    }

    if (!this.framePickerWidget) {
      const framePickerContainer = Dom.getElement<HTMLElement>(
        ".import-preview",
        this.container
      );
      this.framePickerWidget = new FramePicker(
        mergePiskel,
        framePickerContainer
      );
      this.framePickerWidget.init();
    } else if (this.framePickerWidget.piskel != mergePiskel) {
      // If the piskel displayed by the frame picker is different from the previous one,
      // refresh the widget.
      this.framePickerWidget.piskel = mergePiskel;
      this.framePickerWidget.setFrameIndex(1);
    }

    const metaHtml = Template.getAndReplace("import-meta-content", {
      name: mergePiskel.getDescriptor().name,
      dimensions: StringUtils.formatSize(
        mergePiskel.getWidth(),
        mergePiskel.getHeight()
      ),
      frames: mergePiskel.getFrameCount(),
      layers: mergePiskel.getLayers().length
    });
    Dom.getElement<HTMLElement>(".import-meta", this.container).innerHTML =
      metaHtml;
  }
}
