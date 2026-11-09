import { Dom } from "../../utils/Dom";
import { UserSettings } from "../../utils/UserSettings";
import { Tabs } from "../../widgets/Tabs";
import { AbstractSettingController } from "./AbstractSettingController";
import { GridPreferencesController } from "./preferences/GridPreferencesController";
import { MiscPreferencesController } from "./preferences/MiscPreferencesController";
import { TilePreferencesController } from "./preferences/TilePreferencesController";

const tabs = {
  misc: {
    template: "templates/settings/preferences/misc.html",
    controller: MiscPreferencesController
  },
  grid: {
    template: "templates/settings/preferences/grid.html",
    controller: GridPreferencesController
  },
  tile: {
    template: "templates/settings/preferences/tile.html",
    controller: TilePreferencesController
  }
};

export class PreferencesController extends AbstractSettingController {
  tabsWidget: Tabs<PreferencesController>;

  constructor() {
    super();
    this.tabsWidget = new Tabs<PreferencesController>(
      tabs,
      this,
      UserSettings.PREFERENCES_TAB
    );
  }

  init(): void {
    const container = Dom.getElement<HTMLElement>(
      ".settings-section-preferences"
    );
    this.tabsWidget.init(container);
  }

  destroy(): void {
    this.tabsWidget.destroy();
    super.destroy();
  }
}
