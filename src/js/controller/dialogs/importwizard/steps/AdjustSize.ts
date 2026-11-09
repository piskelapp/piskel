import type { Piskel } from "../../../../model/Piskel";
import { Dom } from "../../../../utils/Dom";
import { StringUtils } from "../../../../utils/StringUtils";
import { Template } from "../../../../utils/Template";
import { assertDefined } from "../../../../utils/core";
import { AnchorWidget } from "../../../../widgets/AnchorWidget";
import type { PublicPiskelController } from "../../../piskel/PublicPiskelController";
import type { ImportWizard } from "../ImportWizard";
import { AbstractImportStep } from "./AbstractImportStep";

export class AdjustSize extends AbstractImportStep {
  anchorWidget: AnchorWidget | undefined;
  resizeInfoContainer: HTMLElement | undefined;

  constructor(
    piskelController: PublicPiskelController,
    importController: ImportWizard,
    container: HTMLElement
  ) {
    super(piskelController, importController, container);
  }

  static OPTIONS = {
    KEEP: "keep",
    EXPAND: "expand"
  };

  init(): void {
    super.init();

    // Create anchor widget
    const anchorContainer = Dom.getElement<HTMLElement>(
      ".import-resize-anchor-container",
      this.container
    );
    this.anchorWidget = new AnchorWidget(
      anchorContainer,
      this.onAnchorChange_.bind(this)
    );
    this.anchorWidget.setOrigin("TOPLEFT");

    this.resizeInfoContainer = Dom.getElement<HTMLElement>(
      ".import-resize-info",
      this.container
    );
    this.addEventListener(
      this.resizeInfoContainer,
      "change",
      this.onResizeOptionChange_
    );

    // By default, set the mode to expand to avoid losing any image content.
    this.mergeData.resize = AdjustSize.OPTIONS.EXPAND;
  }

  destroy(): void {
    assertDefined(this.anchorWidget, "anchorWidget").destroy();
    super.destroy();
  }

  onShow(): void {
    this.refresh_();
    super.onShow();
  }

  refresh_(): void {
    const isBigger = this.isImportedPiskelBigger_();
    const keep = this.mergeData.resize === AdjustSize.OPTIONS.KEEP;

    // Refresh resize partial
    const size = this.formatPiskelSize_(this.piskelController.getPiskel());
    const newSize = this.formatPiskelSize_(
      assertDefined(this.mergeData.mergePiskel, "mergePiskel")
    );
    let markup;
    if (isBigger) {
      markup = Template.getAndReplace("import-resize-bigger-partial", {
        size: size,
        newSize: newSize,
        keepChecked: keep ? 'checked="checked"' : "",
        expandChecked: keep ? "" : 'checked="checked"'
      });
    } else {
      markup = Template.getAndReplace("import-resize-smaller-partial", {
        size: size,
        newSize: newSize
      });
    }
    assertDefined(this.resizeInfoContainer, "resizeInfoContainer").innerHTML =
      markup;

    // Update anchor widget
    if (this.mergeData.origin) {
      assertDefined(this.anchorWidget, "anchorWidget").setOrigin(
        this.mergeData.origin
      );
    }

    // Update anchor widget info
    const anchorInfo = Dom.getElement<HTMLElement>(
      ".import-resize-anchor-info",
      this.container
    );
    if (isBigger && keep) {
      anchorInfo.innerHTML = [
        '<div class="import-resize-warning">',
        "  Imported content will be cropped!",
        "</div>",
        "Select crop anchor:"
      ].join("");
    } else if (isBigger) {
      anchorInfo.innerHTML = "Select resize anchor:";
    } else {
      anchorInfo.innerHTML = "Select position anchor:";
    }
  }

  onAnchorChange_(origin: string): void {
    this.mergeData.origin = origin;
  }

  onResizeOptionChange_(): void {
    const value = Dom.getElement<HTMLInputElement>(
      ":checked",
      this.resizeInfoContainer
    ).value;
    if (this.mergeData.resize != value) {
      this.mergeData.resize = value;
      this.refresh_();
    }
  }

  isImportedPiskelBigger_(): boolean {
    const piskel = this.mergeData.mergePiskel;
    if (!piskel) {
      return false;
    }

    return (
      piskel.width > this.piskelController.getWidth() ||
      piskel.height > this.piskelController.getHeight()
    );
  }

  formatPiskelSize_(piskel: Piskel): string {
    return StringUtils.formatSize(piskel.width, piskel.height);
  }
}
