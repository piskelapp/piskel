import { Constants } from "../../../Constants";
import { Events } from "../../../Events";
import { Dom } from "../../../utils/Dom";
import { ResizeUtils } from "../../../utils/ResizeUtils";
import { UserSettings } from "../../../utils/UserSettings";
import { assertDefined } from "../../../utils/core";
import type { PublicPiskelController } from "../../piskel/PublicPiskelController";
import { AbstractSettingController } from "../AbstractSettingController";

export class DefaultSizeController extends AbstractSettingController {
  piskelController: PublicPiskelController;
  container: HTMLElement | undefined;
  widthInput: HTMLInputElement | undefined;
  heightInput: HTMLInputElement | undefined;
  defaultSizeForm: HTMLElement | undefined;

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

    this.defaultSizeForm = Dom.getElement<HTMLFormElement>(
      "form",
      this.container
    );
    this.addEventListener(this.defaultSizeForm, "submit", this.onFormSubmit_);
  }

  onFormSubmit_(evt: Event): void {
    evt.preventDefault();

    const size = ResizeUtils.sanitizeSize(
      assertDefined(this.widthInput, "widthInput").value,
      assertDefined(this.heightInput, "heightInput").value,
      DefaultSizeController.getDefaultSize()
    );

    UserSettings.set(UserSettings.DEFAULT_SIZE, size);
    $.publish(Events.CLOSE_SETTINGS_DRAWER);
  }
}
