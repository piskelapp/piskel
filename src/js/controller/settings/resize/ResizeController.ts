import { Constants } from "@/Constants";
import { Events } from "@/Events";
import { app } from "@/app";
import { Dom } from "@/utils/Dom";
import { ResizeUtils } from "@/utils/ResizeUtils";
import { UserSettings } from "@/utils/UserSettings";
import { assertInitialized } from "@/utils/core";
import { AnchorWidget } from "@/widgets/AnchorWidget";
import { SizeFieldsValidation } from "@/widgets/SizeFieldsValidation";
import { SizeInput } from "@/widgets/SizeInput";
import type { PublicPiskelController } from "@/controller/piskel/PublicPiskelController";
import { AbstractSettingController } from "@/controller/settings/AbstractSettingController";
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
  sizeValidation: SizeFieldsValidation | undefined;

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

    // Created after the SizeInput widget, to check both fields once they are synchronized.
    this.sizeValidation = new SizeFieldsValidation(
      [
        {
          input: this.widthInput,
          error: Dom.getElement<HTMLElement>(
            "#resize-width-error",
            this.container
          ),
          max: Constants.MAX_DEFAULT_WIDTH
        },
        {
          input: this.heightInput,
          error: Dom.getElement<HTMLElement>(
            "#resize-height-error",
            this.container
          ),
          max: Constants.MAX_DEFAULT_HEIGHT
        }
      ],
      Dom.getElement<HTMLInputElement>(".resize-button", this.container)
    );

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
    assertInitialized(this.sizeInputWidget, "sizeInputWidget").destroy();
    assertInitialized(this.sizeValidation, "sizeValidation").destroy();
    super.destroy();
  }

  onResizeFormSubmit_(evt: Event): void {
    evt.preventDefault();

    const width = parseInt(
      assertInitialized(this.widthInput, "widthInput").value,
      10
    );
    const height = parseInt(
      assertInitialized(this.heightInput, "heightInput").value,
      10
    );
    // The button is disabled while a size is invalid: also guard any other way
    // of submitting the form.
    if (!assertInitialized(this.sizeValidation, "sizeValidation").validate()) {
      return;
    }

    const currentPiskel = this.piskelController.getPiskel();
    const piskel = ResizeUtils.resizePiskel(currentPiskel, {
      width,
      height,
      origin: assertInitialized(this.anchorWidget.getOrigin(), "origin"),
      resizeContent: assertInitialized(
        this.resizeContentCheckbox,
        "resizeContentCheckbox"
      ).checked
    });

    assertInitialized(app.piskelController, "piskelController").setPiskel(
      piskel,
      {
        preserveState: true
      }
    );

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
      assertInitialized(this.sizeInputWidget, "sizeInputWidget").enableSync();
      // Enabling the sync may have changed the other field.
      assertInitialized(this.sizeValidation, "sizeValidation").validate();
    } else {
      assertInitialized(this.sizeInputWidget, "sizeInputWidget").disableSync();
    }
  }

  updateUserPreferences_(): void {
    UserSettings.set("RESIZE_SETTINGS", {
      origin: assertInitialized(this.anchorWidget.getOrigin(), "origin"),
      resizeContent: !!assertInitialized(
        this.resizeContentCheckbox,
        "resizeContentCheckbox"
      ).checked,
      maintainRatio: !!assertInitialized(
        this.maintainRatioCheckbox,
        "maintainRatioCheckbox"
      ).checked
    });
  }
}
