import { Dom } from "../../../utils/Dom";
import { UserSettings } from "../../../utils/UserSettings";
import type { PublicPiskelController } from "../../piskel/PublicPiskelController";
import { AbstractSettingController } from "../AbstractSettingController";
import type { PreferencesController } from "../PreferencesController";

export class TilePreferencesController extends AbstractSettingController {
  piskelController: PublicPiskelController;
  preferencesController: PreferencesController;

  constructor(
    piskelController: PublicPiskelController,
    preferencesController: PreferencesController
  ) {
    super();
    this.piskelController = piskelController;
    this.preferencesController = preferencesController;
  }

  init(): void {
    // Tile mode
    const tileMode = UserSettings.get(UserSettings.SEAMLESS_MODE);
    const tileModeCheckbox = Dom.getElement<HTMLInputElement>(
      ".tile-mode-checkbox"
    );
    if (tileMode) {
      tileModeCheckbox.setAttribute("checked", String(tileMode));
    }
    this.addEventListener(tileModeCheckbox, "change", this.onTileModeChange_);

    // Tile mask opacity
    const tileMaskOpacityInput = Dom.getElement<HTMLInputElement>(
      ".tile-mask-opacity-input"
    );
    tileMaskOpacityInput.value = String(
      UserSettings.get(UserSettings.SEAMLESS_OPACITY)
    );
    this.addEventListener(
      tileMaskOpacityInput,
      "change",
      this.onTileMaskOpacityChange_
    );
    this.addEventListener(
      tileMaskOpacityInput,
      "input",
      this.onTileMaskOpacityChange_
    );
    this.updateTileMaskOpacityText_(tileMaskOpacityInput.value);
  }

  onTileModeChange_(evt: Event): void {
    UserSettings.set(
      UserSettings.SEAMLESS_MODE,
      (evt.currentTarget as HTMLInputElement).checked
    );
  }

  onTileMaskOpacityChange_(evt: Event): void {
    const target = evt.target as HTMLInputElement;
    const opacity = parseFloat(target.value);
    if (!isNaN(opacity)) {
      UserSettings.set(UserSettings.SEAMLESS_OPACITY, opacity);
      this.updateTileMaskOpacityText_(opacity);
    } else {
      target.value = String(UserSettings.get(UserSettings.SEAMLESS_OPACITY));
    }
  }

  updateTileMaskOpacityText_(opacity: string | number): void {
    const seamlessOpacityText = Dom.getElement<HTMLElement>(
      ".tile-mask-opacity-text"
    );
    seamlessOpacityText.innerHTML = Number(opacity).toFixed(2);
  }
}
