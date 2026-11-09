import { app } from "../app";
import type { PublicPiskelController } from "../controller/piskel/PublicPiskelController";
import { Dom } from "../utils/Dom";
import { EventUtils } from "../utils/Event";
import { Template } from "../utils/Template";
import { type UserSettingKey, UserSettings } from "../utils/UserSettings";
import { assertDefined } from "../utils/core";

export type TabController = { init(): void; destroy(): void };

export type TabDefinition<P> = {
  template: string;
  controller: new (
    piskelController: PublicPiskelController,
    parentController: P
  ) => TabController;
};

export type TabDefinitions<P> = Record<string, TabDefinition<P>>;

export class Tabs<P> {
  tabs: TabDefinitions<P>;
  parentController: P;
  settingsName: UserSettingKey;
  currentTab: string | null;
  currentController: TabController | null;
  tabListEl: HTMLElement | undefined;
  tabContentlEl: HTMLElement | undefined;

  constructor(
    tabs: TabDefinitions<P>,
    parentController: P,
    settingsName: UserSettingKey
  ) {
    this.tabs = tabs;
    this.parentController = parentController;
    this.settingsName = settingsName;

    this.currentTab = null;
    this.currentController = null;
  }

  init(container: HTMLElement): void {
    this.tabListEl = Dom.getElement<HTMLElement>(".tab-list", container);
    this.tabContentlEl = Dom.getElement<HTMLElement>(".tab-content", container);
    EventUtils.addEventListener(
      this.tabListEl,
      "click",
      this.onTabsClicked_,
      this
    );

    const tab = UserSettings.get(this.settingsName);
    if (typeof tab === "string" && tab) {
      this.selectTab(tab);
    }
  }

  destroy(): void {
    if (this.currentController) {
      this.currentController.destroy();
    }
    EventUtils.removeAllEventListeners(this);
  }

  selectTab(tabId: string | undefined): void {
    if (tabId === undefined || !this.tabs[tabId] || this.currentTab == tabId) {
      return;
    }

    if (this.currentController) {
      this.currentController.destroy();
    }

    assertDefined(this.tabContentlEl, "tabContentlEl").innerHTML = Template.get(
      this.tabs[tabId].template
    );
    const controller = new this.tabs[tabId].controller(
      assertDefined(app.piskelController, "piskelController"),
      this.parentController
    );
    this.currentController = controller;
    controller.init();
    this.currentTab = tabId;
    UserSettings.set(this.settingsName, tabId);

    const selectedTab = assertDefined(
      this.tabListEl,
      "tabListEl"
    ).querySelector(".selected");
    if (selectedTab) {
      selectedTab.classList.remove("selected");
    }
    Dom.getElement<HTMLElement>(
      '[data-tab-id="' + tabId + '"]',
      this.tabListEl
    ).classList.add("selected");
  }

  onTabsClicked_(e: Event): void {
    const tabId = Dom.getData(e.target as HTMLElement, "tabId");
    this.selectTab(tabId);
  }
}
