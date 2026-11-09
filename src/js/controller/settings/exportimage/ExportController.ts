import { Events } from "../../../Events";
import { Dom } from "../../../utils/Dom";
import { UserSettings } from "../../../utils/UserSettings";
import { assertDefined } from "../../../utils/core";
import { SizeInput } from "../../../widgets/SizeInput";
import { Tabs } from "../../../widgets/Tabs";
import type { PublicPiskelController } from "../../piskel/PublicPiskelController";
import { AbstractSettingController } from "../AbstractSettingController";
import { GifExportController } from "./GifExportController";
import { MiscExportController } from "./MiscExportController";
import { PngExportController } from "./PngExportController";
import { ZipExportController } from "./ZipExportController";

const tabs = {
  png: {
    template: "templates/settings/export/png.html",
    controller: PngExportController
  },
  gif: {
    template: "templates/settings/export/gif.html",
    controller: GifExportController
  },
  zip: {
    template: "templates/settings/export/zip.html",
    controller: ZipExportController
  },
  misc: {
    template: "templates/settings/export/misc.html",
    controller: MiscExportController
  }
};

export class ExportController extends AbstractSettingController {
  piskelController: PublicPiskelController;
  tabsWidget: Tabs<ExportController>;
  scaleInput: HTMLInputElement | undefined;
  widthInput: HTMLInputElement | undefined;
  heightInput: HTMLInputElement | undefined;
  sizeInputWidget: SizeInput | undefined;

  constructor(piskelController: PublicPiskelController) {
    super();
    this.piskelController = piskelController;
    this.tabsWidget = new Tabs<ExportController>(
      tabs,
      this,
      UserSettings.EXPORT_TAB
    );
    this.onSizeInputChange_ = this.onSizeInputChange_.bind(this);
  }

  init(): void {
    // Initialize zoom controls
    this.scaleInput = Dom.getElement<HTMLInputElement>(
      ".export-scale .scale-input"
    );
    this.addEventListener(this.scaleInput, "change", this.onScaleChange_);
    this.addEventListener(this.scaleInput, "input", this.onScaleChange_);

    this.widthInput = Dom.getElement<HTMLInputElement>(
      ".export-resize .resize-width"
    );
    this.heightInput = Dom.getElement<HTMLInputElement>(
      ".export-resize .resize-height"
    );
    const scale = UserSettings.get(UserSettings.EXPORT_SCALE);
    this.sizeInputWidget = new SizeInput({
      widthInput: this.widthInput,
      heightInput: this.heightInput,
      initWidth: this.piskelController.getWidth() * scale,
      initHeight: this.piskelController.getHeight() * scale,
      onChange: this.onSizeInputChange_
    });

    this.onSizeInputChange_();

    // Initialize tabs and panel
    const container = Dom.getElement<HTMLElement>(".settings-section-export");
    this.tabsWidget.init(container);
  }

  destroy(): void {
    assertDefined(this.sizeInputWidget, "sizeInputWidget").destroy();
    this.tabsWidget.destroy();
    super.destroy();
  }

  onScaleChange_(): void {
    const value = parseFloat(
      assertDefined(this.scaleInput, "scaleInput").value
    );
    if (!isNaN(value)) {
      if (Math.round(this.getExportZoom()) != value) {
        assertDefined(this.sizeInputWidget, "sizeInputWidget").setWidth(
          this.piskelController.getWidth() * value
        );
      }
      UserSettings.set(UserSettings.EXPORT_SCALE, value);
    }
  }

  updateScaleText_(scale: number): void {
    const scaleValue = scale.toFixed(1);
    const scaleText = Dom.getElement<HTMLElement>(".export-scale .scale-text");
    scaleText.innerHTML = scaleValue + "x";
  }

  onSizeInputChange_(): void {
    const zoom = this.getExportZoom();
    if (isNaN(zoom)) {
      return;
    }

    this.updateScaleText_(zoom);
    $.publish(Events.EXPORT_SCALE_CHANGED);

    assertDefined(this.scaleInput, "scaleInput").value = String(
      Math.round(zoom)
    );
    if (zoom >= 1 && zoom <= 32) {
      this.onScaleChange_();
    }
  }

  getExportZoom(): number {
    return (
      parseInt(assertDefined(this.widthInput, "widthInput").value, 10) /
      this.piskelController.getWidth()
    );
  }
}
