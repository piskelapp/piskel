import { Events, type UserSettingValue } from "../../Events";
import { app } from "../../app";
import type { JQueryEvent } from "../../lib/jquery-1.8.0";
import type { Shortcut } from "../../service/keyboard/Shortcut";
import { Shortcuts } from "../../service/keyboard/Shortcuts";
import { Dom } from "../../utils/Dom";
import { EventUtils } from "../../utils/Event";
import { TooltipFormatter } from "../../utils/TooltipFormatter";
import { UserSettings } from "../../utils/UserSettings";
import { assertDefined } from "../../utils/core";
import type { PublicPiskelController } from "../piskel/PublicPiskelController";
import type { PreviewController } from "./PreviewController";

type PreviewSize = {
  button: HTMLElement;
  shortcut: Shortcut;
  tooltip: string;
  enabled?: boolean;
};

export class PreviewActionsController {
  previewController: PreviewController;
  piskelController: PublicPiskelController;
  container: HTMLElement;
  onionSkinShortcut: Shortcut;
  toggleGridShortcut: Shortcut;
  fpsRangeInput: HTMLInputElement;
  fpsCounterDisplay: HTMLElement;
  openPopupPreview: HTMLElement;
  toggleGridButton: HTMLElement;
  previewSizeDropdown: HTMLElement;
  previewSizes: Record<string, PreviewSize> & { best: PreviewSize };
  toggleOnionSkinButton: HTMLElement;

  constructor(previewController: PreviewController, container: HTMLElement) {
    this.previewController = previewController;
    this.piskelController = previewController.piskelController;
    this.container = container;

    this.onionSkinShortcut = Shortcuts.MISC.ONION_SKIN;
    this.toggleGridShortcut = Shortcuts.MISC.TOGGLE_GRID;

    this.fpsRangeInput = Dom.getElement<HTMLInputElement>("#preview-fps");
    this.fpsCounterDisplay = Dom.getElement<HTMLElement>("#display-fps");
    this.openPopupPreview = Dom.getElement<HTMLElement>(
      ".open-popup-preview-button"
    );
    this.toggleGridButton = Dom.getElement<HTMLElement>(".toggle-grid-button");
    this.previewSizeDropdown =
      Dom.getElement<HTMLSelectElement>(".preview-drop-down");
    this.previewSizes = {
      original: {
        button: Dom.getElement<HTMLElement>(".original-size-button"),
        shortcut: Shortcuts.MISC.X1_PREVIEW,
        tooltip: "Original size preview"
      },
      best: {
        button: Dom.getElement<HTMLElement>(".best-size-button"),
        shortcut: Shortcuts.MISC.BEST_PREVIEW,
        tooltip: "Best size preview"
      },
      full: {
        button: Dom.getElement<HTMLElement>(".full-size-button"),
        shortcut: Shortcuts.MISC.FULL_PREVIEW,
        tooltip: "Full size preview"
      }
    };
    this.toggleOnionSkinButton = Dom.getElement<HTMLElement>(
      ".preview-toggle-onion-skin"
    );
  }

  init(): void {
    this.fpsRangeInput.addEventListener(
      "change",
      this.onFpsRangeInputUpdate_.bind(this)
    );
    this.fpsRangeInput.addEventListener(
      "input",
      this.onFpsRangeInputUpdate_.bind(this)
    );

    const addEvent = EventUtils.addEventListener;
    addEvent(this.toggleOnionSkinButton, "click", this.toggleOnionSkin_, this);
    addEvent(
      this.openPopupPreview,
      "click",
      this.onOpenPopupPreviewClick_,
      this
    );
    addEvent(this.toggleGridButton, "click", this.toggleGrid_, this);

    const registerShortcut = assertDefined(
      app.shortcutService,
      "shortcutService"
    ).registerShortcut.bind(app.shortcutService);
    registerShortcut(this.onionSkinShortcut, this.toggleOnionSkin_.bind(this));
    registerShortcut(this.toggleGridShortcut, this.toggleGrid_.bind(this));

    const onionSkinTooltip = TooltipFormatter.format(
      "Toggle onion skin",
      this.onionSkinShortcut
    );
    this.toggleOnionSkinButton.setAttribute("title", onionSkinTooltip);

    for (const size in this.previewSizes) {
      if (this.previewSizes.hasOwnProperty(size)) {
        const previewSize = this.previewSizes[size];
        addEvent(
          previewSize.button,
          "click",
          this.onChangePreviewSize_,
          this,
          size
        );
        registerShortcut(
          previewSize.shortcut,
          this.onChangePreviewSize_.bind(this, size)
        );
        const tooltip = TooltipFormatter.format(
          previewSize.tooltip,
          previewSize.shortcut
        );
        previewSize.button.setAttribute("title", tooltip);
      }
    }

    $.subscribe(
      Events.FRAME_SIZE_CHANGED,
      this.updatePreviewSizeButtons_.bind(this)
    );
    $.subscribe(
      Events.USER_SETTINGS_CHANGED,
      this.onUserSettingsChange_.bind(this)
    );
    $.subscribe(Events.FPS_CHANGED, this.updateFPS_.bind(this));
    $.subscribe(Events.PISKEL_RESET, this.updateFPS_.bind(this));

    this.updatePreviewSizeButtons_();
    this.updateOnionSkinPreview_();
    this.selectPreviewSizeButton_();
    this.updateFPS_();
    this.updateMaxFPS_();
    this.updateToggleGridButton_();
  }

  updateToggleGridButton_(): void {
    const gridEnabled = UserSettings.get(UserSettings.GRID_ENABLED);
    this.toggleGridButton.classList.toggle(
      "icon-minimap-grid-white",
      !gridEnabled
    );
    this.toggleGridButton.classList.toggle(
      "icon-minimap-grid-gold",
      gridEnabled
    );
    this.toggleGridButton.classList.toggle(
      "preview-contextual-action-enabled",
      gridEnabled
    );
  }

  toggleGrid_(): void {
    const gridEnabled = UserSettings.get(UserSettings.GRID_ENABLED);
    UserSettings.set(UserSettings.GRID_ENABLED, !gridEnabled);
  }

  updatePreviewSizeButtons_(): void {
    const fullZoom = this.previewController.getZoom();
    const bestZoom = Math.floor(fullZoom);
    const seamlessModeEnabled = UserSettings.get(UserSettings.SEAMLESS_MODE);

    let validSizes;
    if (fullZoom < 1) {
      this.disablePreviewSizeWidget_("No other option available");
      validSizes = ["full"];
    } else if (fullZoom === 1) {
      this.disablePreviewSizeWidget_("No other option available");
      validSizes = ["original"];
    } else if (seamlessModeEnabled) {
      this.disablePreviewSizeWidget_("Disabled in tile mode");
      validSizes = ["original"];
    } else {
      this.enablePreviewSizeWidget_();
      if (fullZoom === bestZoom) {
        // If the full zoom is the same as the best zoom, display the best option only as
        // it gives the exact factor information.
        validSizes = ["original", "best"];
      } else if (bestZoom === 1) {
        // If best zoom is 1x, remove it as it is redundant with the original option.
        validSizes = ["full", "original"];
      } else {
        validSizes = ["full", "original", "best"];
      }
    }

    // Update buttons content and status.
    this.previewSizes.best.button.textContent = Math.floor(fullZoom) + "x";
    for (const size in this.previewSizes) {
      if (this.previewSizes.hasOwnProperty(size)) {
        const previewSize = this.previewSizes[size];
        const isSizeEnabled = validSizes.indexOf(size) != -1;

        previewSize.button.classList.toggle(
          "preview-contextual-action-hidden",
          !isSizeEnabled
        );
      }
    }

    // Update the selected preview size if the currently selected size is not valid.
    const selectedSize = UserSettings.get(UserSettings.PREVIEW_SIZE);
    if (validSizes.indexOf(selectedSize) === -1) {
      this.onChangePreviewSize_(validSizes[0]);
    }
  }

  enablePreviewSizeWidget_(): void {
    this.previewSizeDropdown.classList.remove("preview-drop-down-disabled");
  }

  disablePreviewSizeWidget_(reason: string): void {
    // The .preview-disable-overlay is displayed on top of the preview size widget
    Dom.getElement<HTMLElement>(".preview-disable-overlay").setAttribute(
      "data-original-title",
      reason
    );
    this.previewSizeDropdown.classList.add("preview-drop-down-disabled");
  }

  onOpenPopupPreviewClick_(): void {
    this.previewController.openPopupPreview();
  }

  onChangePreviewSize_(size: string): void {
    const previewSize = this.previewSizes[size];
    const isEnabled = !previewSize.button.classList.contains(
      "preview-contextual-action-hidden"
    );
    if (isEnabled) {
      UserSettings.set(UserSettings.PREVIEW_SIZE, size);
    }
  }

  onUserSettingsChange_(
    evt: JQueryEvent,
    name: string,
    value: UserSettingValue
  ): void {
    if (name == UserSettings.ONION_SKIN) {
      this.updateOnionSkinPreview_();
    } else if (name == UserSettings.MAX_FPS) {
      this.updateMaxFPS_();
    } else if (name === UserSettings.SEAMLESS_MODE) {
      this.updatePreviewSizeButtons_();
    } else if (name === UserSettings.GRID_ENABLED) {
      this.updateToggleGridButton_();
    } else {
      this.selectPreviewSizeButton_();
    }
  }

  updateOnionSkinPreview_(): void {
    const enabledClassname = "preview-toggle-onion-skin-enabled";
    const isEnabled = UserSettings.get(UserSettings.ONION_SKIN);

    this.toggleOnionSkinButton.classList.toggle(enabledClassname, isEnabled);
  }

  selectPreviewSizeButton_(): void {
    const currentlySelected = document.querySelector(".size-button-selected");
    if (currentlySelected) {
      currentlySelected.classList.remove("size-button-selected");
    }

    const selectedSize = UserSettings.get(UserSettings.PREVIEW_SIZE);
    const previewSize = this.previewSizes[selectedSize];
    previewSize.button.classList.add("size-button-selected");
  }

  updateMaxFPS_(): void {
    const maxFps = UserSettings.get(UserSettings.MAX_FPS);
    this.fpsRangeInput.setAttribute("max", String(maxFps));
    this.piskelController.setFPS(
      Math.min(maxFps, this.piskelController.getFPS())
    );
  }

  /**
   * Event handler triggered on 'input' or 'change' events.
   */
  onFpsRangeInputUpdate_(evt: Event): void {
    const fps = parseInt(this.fpsRangeInput.value, 10);
    this.piskelController.setFPS(fps);
    // blur only on 'change' events, as blurring on 'input' breaks on Firefox
    if (evt.type === "change") {
      this.fpsRangeInput.blur();
    }
  }

  updateFPS_(): void {
    const fps = this.piskelController.getFPS();
    // reset
    this.fpsRangeInput.value = String(0);
    // set proper value
    this.fpsRangeInput.value = String(fps);
    this.fpsCounterDisplay.innerHTML = fps + " FPS";
  }

  toggleOnionSkin_(): void {
    const currentValue = UserSettings.get(UserSettings.ONION_SKIN);
    UserSettings.set(UserSettings.ONION_SKIN, !currentValue);
  }
}
