import { Events } from "../../../Events";
import { app } from "../../../app";
import { Dom } from "../../../utils/Dom";
import { ResizeUtils } from "../../../utils/ResizeUtils";
import { UserSettings } from "../../../utils/UserSettings";
import { assertDefined } from "../../../utils/core";
import { AnchorWidget } from "../../../widgets/AnchorWidget";
import { SizeInput } from "../../../widgets/SizeInput";
import type { PublicPiskelController } from "../../piskel/PublicPiskelController";
import { AbstractSettingController } from "../AbstractSettingController";
import { DefaultSizeController } from "./DefaultSizeController";

export class ResizeController extends AbstractSettingController {
  piskelController: PublicPiskelController;
  container: HTMLElement;
  anchorWidget: AnchorWidget;
  defaultSizeController: DefaultSizeController;
  widthInput: HTMLInputElement | undefined;
  heightInput: HTMLInputElement | undefined;
  resizeForm: HTMLElement | undefined;
  resizeContentCheckbox: HTMLInputElement | undefined;
  maintainRatioCheckbox: HTMLInputElement | undefined;
  sizeInputWidget: SizeInput | undefined;

  constructor(piskelController: PublicPiskelController) {
    super();
    this.piskelController = piskelController;

    this.container = Dom.getElement<HTMLElement>(".resize-canvas");

    const anchorWidgetContainer = Dom.getElement<HTMLElement>(
      ".resize-anchor-container",
      this.container
    );
    this.anchorWidget = new AnchorWidget(anchorWidgetContainer);
    this.defaultSizeController = new DefaultSizeController(piskelController);
  }

  init(): void {
    this.widthInput = Dom.getElement<HTMLInputElement>(
      '[name="resize-width"]',
      this.container
    );
    this.heightInput = Dom.getElement<HTMLInputElement>(
      '[name="resize-height"]',
      this.container
    );
    this.resizeForm = Dom.getElement<HTMLFormElement>("form", this.container);
    this.resizeContentCheckbox = Dom.getElement<HTMLInputElement>(
      ".resize-content-checkbox",
      this.container
    );
    this.maintainRatioCheckbox = Dom.getElement<HTMLInputElement>(
      ".resize-ratio-checkbox",
      this.container
    );

    this.sizeInputWidget = new SizeInput({
      widthInput: this.widthInput,
      heightInput: this.heightInput,
      initWidth: this.piskelController.getWidth(),
      initHeight: this.piskelController.getHeight()
    });

    const settings = UserSettings.get("RESIZE_SETTINGS");
    const origin =
      settings.origin in AnchorWidget.ORIGIN ? settings.origin : "TOPLEFT";
    this.anchorWidget.setOrigin(origin);

    if (settings.resizeContent) {
      this.resizeContentCheckbox.checked = true;
      this.anchorWidget.disable();
    }

    if (settings.maintainRatio) {
      this.maintainRatioCheckbox.checked = true;
    } else {
      // the SizeInput widget is enabled by default
      this.sizeInputWidget.disableSync();
    }

    this.addEventListener(this.resizeForm, "submit", this.onResizeFormSubmit_);
    this.addEventListener(
      this.resizeContentCheckbox,
      "change",
      this.onResizeContentChange_
    );
    this.addEventListener(
      this.maintainRatioCheckbox,
      "change",
      this.onMaintainRatioChange_
    );

    this.defaultSizeController.init();
  }

  destroy(): void {
    this.updateUserPreferences_();

    this.anchorWidget.destroy();
    assertDefined(this.sizeInputWidget, "sizeInputWidget").destroy();
    super.destroy();
  }

  onResizeFormSubmit_(evt: Event): void {
    evt.preventDefault();

    const currentPiskel = this.piskelController.getPiskel();
    const piskel = ResizeUtils.resizePiskel(currentPiskel, {
      width: parseInt(assertDefined(this.widthInput, "widthInput").value, 10),
      height: parseInt(
        assertDefined(this.heightInput, "heightInput").value,
        10
      ),
      origin: assertDefined(this.anchorWidget.getOrigin(), "origin"),
      resizeContent: assertDefined(
        this.resizeContentCheckbox,
        "resizeContentCheckbox"
      ).checked
    });

    assertDefined(app.piskelController, "piskelController").setPiskel(piskel, {
      preserveState: true
    });

    $.publish(Events.CLOSE_SETTINGS_DRAWER);
  }

  onResizeContentChange_(evt: Event): void {
    const target = evt.target as HTMLInputElement;
    if (target.checked) {
      this.anchorWidget.disable();
    } else {
      this.anchorWidget.enable();
    }
  }

  onMaintainRatioChange_(evt: Event): void {
    const target = evt.target as HTMLInputElement;
    if (target.checked) {
      assertDefined(this.sizeInputWidget, "sizeInputWidget").enableSync();
    } else {
      assertDefined(this.sizeInputWidget, "sizeInputWidget").disableSync();
    }
  }

  updateUserPreferences_(): void {
    UserSettings.set("RESIZE_SETTINGS", {
      origin: assertDefined(this.anchorWidget.getOrigin(), "origin"),
      resizeContent: !!assertDefined(
        this.resizeContentCheckbox,
        "resizeContentCheckbox"
      ).checked,
      maintainRatio: !!assertDefined(
        this.maintainRatioCheckbox,
        "maintainRatioCheckbox"
      ).checked
    });
  }
}
