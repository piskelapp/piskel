import { Dom } from "../../../utils/Dom";
import { UserSettings } from "../../../utils/UserSettings";
import { assertDefined } from "../../../utils/core";
import type { PublicPiskelController } from "../../piskel/PublicPiskelController";
import { AbstractSettingController } from "../AbstractSettingController";
import type { PreferencesController } from "../PreferencesController";

export class MiscPreferencesController extends AbstractSettingController {
  piskelController: PublicPiskelController;
  preferencesController: PreferencesController;
  backgroundContainer: HTMLElement | undefined;

  constructor(
    piskelController: PublicPiskelController,
    preferencesController: PreferencesController
  ) {
    super();
    this.piskelController = piskelController;
    this.preferencesController = preferencesController;
  }

  init(): void {
    this.backgroundContainer = Dom.getElement<HTMLElement>(
      ".background-picker-wrapper"
    );
    this.addEventListener(
      this.backgroundContainer,
      "click",
      this.onBackgroundClick_
    );

    // Highlight selected background :
    const background = UserSettings.get(UserSettings.CANVAS_BACKGROUND);
    const selectedBackground = this.backgroundContainer.querySelector(
      "[data-background=" + background + "]"
    );
    if (selectedBackground) {
      selectedBackground.classList.add("selected");
    }

    // Max FPS
    const maxFpsInput = Dom.getElement<HTMLInputElement>(".max-fps-input");
    maxFpsInput.value = String(UserSettings.get(UserSettings.MAX_FPS));
    this.addEventListener(maxFpsInput, "change", this.onMaxFpsChange_);

    // Color format
    const colorFormat = UserSettings.get(UserSettings.COLOR_FORMAT);
    const colorFormatSelect = Dom.getElement<HTMLSelectElement>(
      ".color-format-select"
    );
    const selectedColorFormatOption = colorFormatSelect.querySelector(
      'option[value="' + colorFormat + '"]'
    );
    if (selectedColorFormatOption) {
      selectedColorFormatOption.setAttribute("selected", "selected");
    }
    this.addEventListener(
      colorFormatSelect,
      "change",
      this.onColorFormatChange_
    );

    // Layer preview opacity
    const layerOpacityInput = Dom.getElement<HTMLInputElement>(
      ".layer-opacity-input"
    );
    layerOpacityInput.value = String(
      UserSettings.get(UserSettings.LAYER_OPACITY)
    );
    this.addEventListener(
      layerOpacityInput,
      "change",
      this.onLayerOpacityChange_
    );
    this.addEventListener(
      layerOpacityInput,
      "input",
      this.onLayerOpacityChange_
    );
    this.updateLayerOpacityText_(layerOpacityInput.value);
  }

  onBackgroundClick_(evt: Event): void {
    const target = evt.target as HTMLInputElement;
    const background = target.dataset.background;
    if (background) {
      UserSettings.set(UserSettings.CANVAS_BACKGROUND, background);
      const selected = assertDefined(
        this.backgroundContainer,
        "backgroundContainer"
      ).querySelector(".selected");
      if (selected) {
        selected.classList.remove("selected");
      }
      target.classList.add("selected");
    }
  }

  onColorFormatChange_(evt: Event): void {
    UserSettings.set(
      UserSettings.COLOR_FORMAT,
      (evt.target as HTMLInputElement).value
    );
  }

  onMaxFpsChange_(evt: Event): void {
    const target = evt.target as HTMLInputElement;
    const fps = parseInt(target.value, 10);
    if (fps && !isNaN(fps)) {
      UserSettings.set(UserSettings.MAX_FPS, fps);
    } else {
      target.value = String(UserSettings.get(UserSettings.MAX_FPS));
    }
  }

  onLayerOpacityChange_(evt: Event): void {
    const target = evt.target as HTMLInputElement;
    const opacity = parseFloat(target.value);
    if (!isNaN(opacity)) {
      UserSettings.set(UserSettings.LAYER_OPACITY, opacity);
      UserSettings.set(UserSettings.LAYER_PREVIEW, opacity !== 0);
      this.updateLayerOpacityText_(opacity);
    } else {
      target.value = String(UserSettings.get(UserSettings.LAYER_OPACITY));
    }
  }

  updateLayerOpacityText_(opacity: string | number): void {
    const layerOpacityText = Dom.getElement<HTMLElement>(".layer-opacity-text");
    layerOpacityText.innerHTML = Number(opacity).toFixed(2);
  }
}
