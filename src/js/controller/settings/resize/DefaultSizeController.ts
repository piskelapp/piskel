import { Constants } from "@/Constants";
import { Events } from "@/Events";
import { Dom } from "@/utils/Dom";
import { ResizeUtils } from "@/utils/ResizeUtils";
import { UserSettings } from "@/utils/UserSettings";
import { assertInitialized } from "@/utils/core";
import { SizeFieldsValidation } from "@/widgets/SizeFieldsValidation";
import type { PublicPiskelController } from "@/controller/piskel/PublicPiskelController";
import { AbstractSettingController } from "@/controller/settings/AbstractSettingController";

export class DefaultSizeController extends AbstractSettingController {
  piskelController: PublicPiskelController;
  container: HTMLElement | undefined;
  widthInput: HTMLInputElement | undefined;
  heightInput: HTMLInputElement | undefined;
  defaultSizeForm: HTMLElement | undefined;
  sizeValidation: SizeFieldsValidation | undefined;

  constructor(piskelController: PublicPiskelController) {
    super();
    this.piskelController = piskelController;
  }

  /**
   * Returns the default size from the user settings. The stored value is sanitized
   * since it may have been saved by an older version without any size limit.
   */
  static getDefaultSize(): { width: number; height: number } {
    const defaultSize = UserSettings.get(UserSettings.DEFAULT_SIZE);
    return ResizeUtils.sanitizeSize(defaultSize.width, defaultSize.height, {
      width: Constants.DEFAULT.WIDTH,
      height: Constants.DEFAULT.HEIGHT
    });
  }

  init(): void {
    this.container = Dom.getElement<HTMLElement>(".settings-default-size");

    const defaultSize = DefaultSizeController.getDefaultSize();

    this.widthInput = Dom.getElement<HTMLInputElement>(
      '[name="default-width"]',
      this.container
    );
    this.heightInput = Dom.getElement<HTMLInputElement>(
      '[name="default-height"]',
      this.container
    );

    this.widthInput.value = String(defaultSize.width);
    this.heightInput.value = String(defaultSize.height);

    this.sizeValidation = new SizeFieldsValidation(
      [
        {
          input: this.widthInput,
          error: Dom.getElement<HTMLElement>(
            "#default-width-error",
            this.container
          ),
          max: Constants.MAX_DEFAULT_WIDTH
        },
        {
          input: this.heightInput,
          error: Dom.getElement<HTMLElement>(
            "#default-height-error",
            this.container
          ),
          max: Constants.MAX_DEFAULT_HEIGHT
        }
      ],
      Dom.getElement<HTMLInputElement>(".default-size-button", this.container)
    );

    this.defaultSizeForm = Dom.getElement<HTMLFormElement>(
      "form",
      this.container
    );
    this.addEventListener(this.defaultSizeForm, "submit", this.onFormSubmit_);
  }

  destroy(): void {
    this.sizeValidation?.destroy();
    super.destroy();
  }

  onFormSubmit_(evt: Event): void {
    evt.preventDefault();

    // The button is disabled while a size is invalid: also guard any other way
    // of submitting the form.
    if (!assertInitialized(this.sizeValidation, "sizeValidation").validate()) {
      return;
    }

    const size = ResizeUtils.sanitizeSize(
      assertInitialized(this.widthInput, "widthInput").value,
      assertInitialized(this.heightInput, "heightInput").value,
      DefaultSizeController.getDefaultSize()
    );

    UserSettings.set(UserSettings.DEFAULT_SIZE, size);
    $.publish(Events.CLOSE_SETTINGS_DRAWER);
  }
}
