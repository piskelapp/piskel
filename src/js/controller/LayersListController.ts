import { Constants } from "../Constants";
import { Events, type UserSettingValue } from "../Events";
import { app } from "../app";
import type { JQueryEvent } from "../lib/jquery-1.8.0";
import type { Layer } from "../model/Layer";
import type { Shortcut } from "../service/keyboard/Shortcut";
import { Shortcuts } from "../service/keyboard/Shortcuts";
import { Dom } from "../utils/Dom";
import { Template } from "../utils/Template";
import { TooltipFormatter } from "../utils/TooltipFormatter";
import { UserSettings } from "../utils/UserSettings";
import { assertDefined } from "../utils/core";
import type { PublicPiskelController } from "./piskel/PublicPiskelController";

export class LayersListController {
  piskelController: PublicPiskelController;
  layerPreviewShortcut: Shortcut;
  isRenaming: boolean | undefined;
  layerItemTemplate_: string | undefined;
  layerNameInputTemplate_: string | undefined;
  rootEl: HTMLElement | undefined;
  layersListEl: HTMLElement | undefined;
  toggleLayerPreviewEl: HTMLElement | undefined;

  constructor(piskelController: PublicPiskelController) {
    this.piskelController = piskelController;
    this.layerPreviewShortcut = Shortcuts.MISC.LAYER_PREVIEW;
    this.startRenamingCurrentLayer_ =
      this.startRenamingCurrentLayer_.bind(this);
    this.onRenameInput_ = this.onRenameInput_.bind(this);
  }

  init(): void {
    this.isRenaming = false;

    this.layerItemTemplate_ = Template.get("layer-item-template");
    this.layerNameInputTemplate_ = Template.get("layer-name-input-template");
    this.rootEl = Dom.getElement<HTMLElement>(".layers-list-container");
    this.layersListEl = Dom.getElement<HTMLElement>(".layers-list");
    this.toggleLayerPreviewEl = Dom.getElement<HTMLElement>(
      ".layers-toggle-preview"
    );

    this.rootEl.addEventListener("click", this.onClick_.bind(this));
    this.toggleLayerPreviewEl.addEventListener(
      "click",
      this.toggleLayerPreview_.bind(this)
    );

    this.createButtonTooltips_();
    this.initToggleLayerPreview_();

    this.renderLayerList_();
    this.updateToggleLayerPreview_();

    $.subscribe(Events.PISKEL_RESET, this.renderLayerList_.bind(this));
    $.subscribe(
      Events.USER_SETTINGS_CHANGED,
      this.onUserSettingsChange_.bind(this)
    );
  }

  renderLayerList_(): void {
    // Backup scroll before refresh.
    const scrollTop = assertDefined(
      this.layersListEl,
      "layersListEl"
    ).scrollTop;

    assertDefined(this.layersListEl, "layersListEl").innerHTML = "";
    const layers = this.piskelController.getLayers();
    layers.forEach(this.addLayerItem.bind(this));
    this.updateButtonStatus_();

    // Restore scroll
    assertDefined(this.layersListEl, "layersListEl").scrollTop = scrollTop;

    // Ensure the currently the selected layer is visible.
    const currentLayerEl = assertDefined(
      this.layersListEl,
      "layersListEl"
    ).querySelector(".current-layer-item");
    if (currentLayerEl) {
      currentLayerEl.scrollIntoView({ block: "nearest" });
    }
  }

  createButtonTooltips_(): void {
    const addTooltip = TooltipFormatter.format("Create a layer", undefined, [
      { key: "shift", description: "Clone current layer" }
    ]);
    const addButton = Dom.getElement<HTMLElement>(
      '[data-action="add"]',
      this.rootEl
    );
    addButton.setAttribute("title", addTooltip);

    const moveDownTooltip = TooltipFormatter.format(
      "Move layer down",
      undefined,
      [{ key: "shift", description: "Move to the bottom" }]
    );
    const moveDownButton = Dom.getElement<HTMLElement>(
      '[data-action="down"]',
      this.rootEl
    );
    moveDownButton.setAttribute("title", moveDownTooltip);

    const moveUpTooltip = TooltipFormatter.format("Move layer up", undefined, [
      { key: "shift", description: "Move to the top" }
    ]);
    const moveUpButton = Dom.getElement<HTMLElement>(
      '[data-action="up"]',
      this.rootEl
    );
    moveUpButton.setAttribute("title", moveUpTooltip);
  }

  initToggleLayerPreview_(): void {
    const descriptors = [{ description: "Opacity defined in PREFERENCES" }];
    const helpText = "Preview all layers";

    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      this.layerPreviewShortcut,
      this.toggleLayerPreview_.bind(this)
    );
    const tooltip = TooltipFormatter.format(
      helpText,
      this.layerPreviewShortcut,
      descriptors
    );
    assertDefined(
      this.toggleLayerPreviewEl,
      "toggleLayerPreviewEl"
    ).setAttribute("title", tooltip);
  }

  updateButtonStatus_(): void {
    const layers = this.piskelController.getLayers();
    const index = this.piskelController.getCurrentLayerIndex();

    const isLast = index === 0;
    const isOnly = layers.length === 1;
    const isFirst = index === layers.length - 1;

    this.toggleButtonDisabledState_("up", isFirst);
    this.toggleButtonDisabledState_("down", isLast);
    this.toggleButtonDisabledState_("merge", isLast);
    this.toggleButtonDisabledState_("delete", isOnly);
  }

  toggleButtonDisabledState_(buttonAction: string, isDisabled: boolean): void {
    const button = Dom.getElement<HTMLElement>(
      '.layers-button[data-action="' + buttonAction + '"]'
    );
    if (isDisabled) {
      button.setAttribute("disabled", "disabled");
      // Disabled/focused buttons consume key events on Firefox, so make sure to blur.
      button.blur();
    } else {
      button.removeAttribute("disabled");
    }
  }

  updateToggleLayerPreview_(): void {
    const enabledClassname = "layers-toggle-preview-enabled";
    if (UserSettings.get(UserSettings.LAYER_PREVIEW)) {
      assertDefined(
        this.toggleLayerPreviewEl,
        "toggleLayerPreviewEl"
      ).classList.add(enabledClassname);
    } else {
      assertDefined(
        this.toggleLayerPreviewEl,
        "toggleLayerPreviewEl"
      ).classList.remove(enabledClassname);
    }
  }

  onUserSettingsChange_(
    evt: JQueryEvent,
    name: string,
    value: UserSettingValue
  ): void {
    if (name == UserSettings.LAYER_PREVIEW) {
      this.updateToggleLayerPreview_();
    }
  }

  addLayerItem(layer: Layer, index: number): void {
    const isSelected = this.piskelController.getCurrentLayer() === layer;
    const isRenaming = isSelected && this.isRenaming;
    const layerItemHtml = Template.replace(
      assertDefined(this.layerItemTemplate_, "layerItemTemplate_"),
      {
        layername: layer.getName(),
        layerindex: index,
        "isselected:current-layer-item": isSelected,
        opacity: layer.getOpacity()
      }
    );
    const layerItem = Template.createFromHTML(layerItemHtml) as HTMLElement;
    assertDefined(this.layersListEl, "layersListEl").insertBefore(
      layerItem,
      assertDefined(this.layersListEl, "layersListEl").firstChild
    );
    if (layerItem.offsetWidth < layerItem.scrollWidth) {
      const layerNameEl = Dom.getElement<HTMLElement>(".layer-name", layerItem);
      layerNameEl.classList.add("overflowing-name");
      layerNameEl.setAttribute("title", layer.getName());
      layerNameEl.setAttribute("rel", "tooltip");
    }
    if (isSelected) {
      layerItem.removeEventListener(
        "dblclick",
        this.startRenamingCurrentLayer_
      );
      layerItem.addEventListener("dblclick", this.startRenamingCurrentLayer_);
    }
    if (isRenaming) {
      const layerNameInputHtml = Template.replace(
        assertDefined(this.layerNameInputTemplate_, "layerNameInputTemplate_"),
        {
          layername: layer.getName()
        }
      );
      const layerNameInput = Template.createFromHTML(
        layerNameInputHtml
      ) as HTMLInputElement;
      const layerNameEl = Dom.getElement<HTMLElement>(".layer-name", layerItem);
      layerItem.replaceChild(layerNameInput, layerNameEl);
      layerNameInput.removeEventListener("blur", this.onRenameInput_);
      layerNameInput.removeEventListener("keydown", this.onRenameInput_);
      layerNameInput.addEventListener("blur", this.onRenameInput_);
      layerNameInput.addEventListener("keydown", this.onRenameInput_);
      layerNameInput.focus();
      layerNameInput.select();
    }
    const opacity = layer.getOpacity();
    if (opacity == 1) {
      Dom.getElement<HTMLElement>(
        ".layer-item-opacity",
        layerItem
      ).style.color = "#ffd700";
    } else if (opacity == 0) {
      Dom.getElement<HTMLElement>(
        ".layer-item-opacity",
        layerItem
      ).style.color = "#969696";
    } else {
      Dom.getElement<HTMLElement>(
        ".layer-item-opacity",
        layerItem
      ).style.color = "#ffffff";
    }
  }

  onClick_(evt: MouseEvent): void {
    const el = (evt.target || evt.srcElement) as HTMLElement;
    let index;
    if (el.classList.contains("layer-name")) {
      const currentIndex = this.piskelController.getCurrentLayerIndex();
      index = Dom.getData(el, "layerIndex");
      if (Number(index) != currentIndex) {
        const currentItem = Dom.getElement<HTMLElement>(
          ".current-layer-item",
          assertDefined(
            assertDefined(el.parentElement, "parentElement").parentElement,
            "parentElement"
          )
        );
        currentItem.removeEventListener(
          "dblclick",
          this.startRenamingCurrentLayer_
        );
        this.piskelController.setCurrentLayerIndex(parseInt(String(index), 10));
      }
    } else if (el.classList.contains("layer-item-opacity")) {
      index = Dom.getData(el, "layerIndex");
      const layerIndex = parseInt(String(index), 10);
      const layer = this.piskelController.getLayerAt(layerIndex);
      const opacity = window.prompt(
        "Set layer opacity (value between 0 and 1)",
        String(layer.getOpacity())
      );
      this.piskelController.setLayerOpacityAt(layerIndex, opacity);
    } else {
      const containingButton = el.closest(".button");
      if (containingButton && containingButton.classList.contains("button")) {
        this.onButtonClick_(containingButton, evt);
      }
    }
  }

  startRenamingCurrentLayer_(): void {
    this.isRenaming = true;
    this.renderLayerList_();
  }

  onRenameInput_(evt: Event): void {
    const el = (evt.target || evt.srcElement) as HTMLInputElement;
    const key = (evt as KeyboardEvent).key;
    if (key === "Enter") {
      this.finishRenamingCurrentLayer_(el, el.value);
    } else if (!key || key === "Escape") {
      this.finishRenamingCurrentLayer_(el);
    }
  }

  finishRenamingCurrentLayer_(input: EventTarget, newName?: string): void {
    if (newName) {
      const index = this.piskelController.getCurrentLayerIndex();
      this.piskelController.renameLayerAt(index, newName);
    }
    input.removeEventListener(
      "blur",
      assertDefined(this.onRenameInput_, "onRenameInput_")
    );
    input.removeEventListener(
      "keydown",
      assertDefined(this.onRenameInput_, "onRenameInput_")
    );
    this.isRenaming = false;
    this.renderLayerList_();
  }

  mergeDownCurrentLayer_(): void {
    const index = this.piskelController.getCurrentLayerIndex();
    this.piskelController.mergeDownLayerAt(index);
    this.renderLayerList_();
  }

  onButtonClick_(button: Element, evt: MouseEvent): void {
    const action = button.getAttribute("data-action");
    if (action == "up") {
      this.piskelController.moveLayerUp(evt.shiftKey);
    } else if (action == "down") {
      this.piskelController.moveLayerDown(evt.shiftKey);
    } else if (action == "add") {
      if (evt.shiftKey) {
        this.piskelController.duplicateCurrentLayer();
      } else {
        this.piskelController.createLayer();
      }
    } else if (action == "delete") {
      this.piskelController.removeCurrentLayer();
    } else if (action == "merge") {
      this.mergeDownCurrentLayer_();
    } else if (action == "edit") {
      this.startRenamingCurrentLayer_();
    }
  }

  toggleLayerPreview_(): void {
    const currentValue = UserSettings.get(UserSettings.LAYER_PREVIEW);
    const currentLayerOpacity = UserSettings.get(UserSettings.LAYER_OPACITY);

    const showLayerPreview = !currentValue;
    UserSettings.set(UserSettings.LAYER_PREVIEW, showLayerPreview);

    if (showLayerPreview && currentLayerOpacity === 0) {
      UserSettings.set(
        UserSettings.LAYER_OPACITY,
        Constants.DEFAULT.LAYER_OPACITY
      );
    }
  }
}
