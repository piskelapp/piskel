(function () {
  var ns = $.namespace('pskl.widgets');

  /**
   * Simple layout widget to display one step element (DOM Element) at a time.
   * When switching to another step, the new step element will slide over the
   * current step element. When going back to the previous step, the current
   * step element will slide out from the container to reveal the previous one.
   *
   * @param {Object} steps map of step descriptions with the step name as the key.
   *        Each step description contains:
   *        - el {Element} the DOM Element corresponding to this step
   *        - name {String} the name of the step (redundant with the key)
   * @param {Element} container the DOM Element in which the wizard should be
   *        displayed.
   */
  ns.Tabs = function (tabs, parentController, settingsName) {
    this.tabs = tabs;
    this.parentController = parentController;
    this.settingsName = settingsName;

    this.currentTab = null;
    this.currentController = null;
  };

  ns.Tabs.prototype.init = function (container) {
    this.tabListEl = container.querySelector('.tab-list');
    this.tabContentlEl = container.querySelector('.tab-content');
    pskl.utils.Event.addEventListener(this.tabListEl, 'click', this.onTabsClicked_, this);

    var tab = pskl.UserSettings.get(this.settingsName);
    if (tab) {
      this.selectTab(tab);
    }
  };

  ns.Tabs.prototype.destroy = function () {
    if (this.currentController) {
      this.currentController.destroy();
    }
    pskl.utils.Event.removeAllEventListeners(this);
  };

  ns.Tabs.prototype.selectTab = function (tabId) {
    if (!this.tabs[tabId] || this.currentTab == tabId) {
      return;
    }

    if (this.currentController) {
      this.currentController.destroy();
    }

    this.tabContentlEl.innerHTML = pskl.utils.Template.get(this.tabs[tabId].template);
    this.currentController = new this.tabs[tabId].controller(pskl.app.piskelController, this.parentController);
    this.currentController.init();
    this.currentTab = tabId;
    pskl.UserSettings.set(this.settingsName, tabId);

    var selectedTab = this.tabListEl.querySelector('.selected');
    if (selectedTab) {
      selectedTab.classList.remove('selected');
    }
    this.tabListEl.querySelector('[data-tab-id="' + tabId + '"]').classList.add('selected');
  };

  ns.Tabs.prototype.onTabsClicked_ = function (e) {
    var tabId = pskl.utils.Dom.getData(e.target, 'tabId');
    this.selectTab(tabId);
  };
})();
