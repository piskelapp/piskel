import { Events } from "../../Events";
import { app } from "../../app";
import type { Shortcut } from "../../service/keyboard/Shortcut";
import { Shortcuts } from "../../service/keyboard/Shortcuts";
import { Dom } from "../../utils/Dom";
import { EventUtils } from "../../utils/Event";
import { Template } from "../../utils/Template";
import { assertDefined } from "../../utils/core";
import type { PublicPiskelController } from "../piskel/PublicPiskelController";
import { ImportController } from "./ImportController";
import { PreferencesController } from "./PreferencesController";
import { SaveController } from "./SaveController";
import { ExportController } from "./exportimage/ExportController";
import { ResizeController } from "./resize/ResizeController";

type SettingController = {
  init(): void;
  destroy?(): void;
};

type SettingDefinition = {
  template: string;
  controller?: new (
    piskelController: PublicPiskelController
  ) => SettingController;
};

const settings: Record<string, SettingDefinition> = {
  user: {
    template: "templates/settings/preferences.html",
    controller: PreferencesController
  },
  resize: {
    template: "templates/settings/resize.html",
    controller: ResizeController
  },
  export: {
    template: "templates/settings/export.html",
    controller: ExportController
  },
  import: {
    template: "templates/settings/import.html",
    controller: ImportController
  },
  localstorage: {
    template: "templates/settings/localstorage.html",
    controller: undefined
  },
  save: {
    template: "templates/settings/save.html",
    controller: SaveController
  }
};

const SEL_SETTING_CLS = "has-expanded-drawer";

const EXP_DRAWER_CLS = "expanded";

export class SettingsController {
  piskelController: PublicPiskelController;
  closeDrawerShortcut: Shortcut;
  settingsContainer: HTMLElement;
  drawerContainer: HTMLElement;
  isExpanded: boolean;
  currentSetting: unknown | null;
  currentController: SettingController | null | undefined;

  constructor(piskelController: PublicPiskelController) {
    this.piskelController = piskelController;
    this.closeDrawerShortcut = Shortcuts.MISC.CLOSE_POPUP;
    this.settingsContainer = Dom.getElement<HTMLElement>(
      "[data-pskl-controller=settings]"
    );
    this.drawerContainer = Dom.getElement<HTMLElement>("#drawer-container");
    this.isExpanded = false;
    this.currentSetting = null;
  }

  /**
   * @public
   */
  init(): void {
    EventUtils.addEventListener(
      this.settingsContainer,
      "click",
      this.onSettingsContainerClick_,
      this
    );
    EventUtils.addEventListener(
      document.body,
      "click",
      this.onBodyClick_,
      this
    );

    $.subscribe(Events.CLOSE_SETTINGS_DRAWER, this.closeDrawer_.bind(this));
  }

  onSettingsContainerClick_(evt: Event): void {
    const setting = Dom.getData(evt.target as HTMLElement, "setting");
    if (!setting) {
      return;
    }

    if (this.currentSetting != setting) {
      this.loadSetting_(setting);
    } else {
      this.closeDrawer_();
    }

    evt.stopPropagation();
    evt.preventDefault();
  }

  onBodyClick_(evt: Event): void {
    const target = evt.target as HTMLElement;

    const isInDrawerContainer = Dom.isParent(target, this.drawerContainer);
    const isInSettingsIcon = target.dataset.setting;
    const isInSettingsContainer = isInDrawerContainer || isInSettingsIcon;

    if (this.isExpanded && !isInSettingsContainer) {
      this.closeDrawer_();
    }
  }

  loadSetting_(setting: string): void {
    this.drawerContainer.innerHTML = Template.get(settings[setting].template);

    // when switching settings controller, destroy previously loaded controller
    this.destroyCurrentController_();

    this.currentSetting = setting;
    const Controller = assertDefined(
      settings[setting].controller,
      "controller"
    );
    const controller = new Controller(this.piskelController);
    this.currentController = controller;
    controller.init();

    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      this.closeDrawerShortcut,
      this.closeDrawer_.bind(this)
    );

    Dom.removeClass(SEL_SETTING_CLS);
    const selectedSettingButton = document.querySelector(
      "[data-setting=" + setting + "]"
    );
    if (selectedSettingButton) {
      selectedSettingButton.classList.add(SEL_SETTING_CLS);
    }
    this.settingsContainer.classList.add(EXP_DRAWER_CLS);

    this.isExpanded = true;
  }

  closeDrawer_(): void {
    Dom.removeClass(SEL_SETTING_CLS);
    this.settingsContainer.classList.remove(EXP_DRAWER_CLS);

    this.isExpanded = false;
    this.currentSetting = null;
    (
      assertDefined(document.activeElement, "activeElement") as HTMLElement
    ).blur();

    this.destroyCurrentController_();
  }

  destroyCurrentController_(): void {
    if (this.currentController) {
      assertDefined(app.shortcutService, "shortcutService").unregisterShortcut(
        this.closeDrawerShortcut
      );
      if (this.currentController.destroy) {
        this.currentController.destroy();
        this.currentController = null;
      }
    }
  }
}
