(function () {
  var ns = $.namespace('pskl.controller.settings');

  var tabs = {
    'main' : {
      template : 'templates/settings/application/main.html',
      controller : ns.application.MainApplicationController
    },
    'grid' : {
      template : 'templates/settings/application/grid.html',
      controller : ns.application.GridApplicationController
    },
    'tile' : {
      template : 'templates/settings/application/tile.html',
      controller : ns.application.TileApplicationController
    }
  };

  ns.ApplicationSettingsController = function () {
    this.tabsWidget = new pskl.widgets.Tabs(tabs, this, pskl.UserSettings.APPLICATION_SETTINGS_TAB);
  };

  pskl.utils.inherit(ns.ApplicationSettingsController, pskl.controller.settings.AbstractSettingController);

  ns.ApplicationSettingsController.prototype.init = function() {
    var container = document.querySelector('.settings-section-application');
    this.tabsWidget.init(container);
  };

  ns.ApplicationSettingsController.prototype.destroy = function () {
    this.tabsWidget.destroy();
    this.superclass.destroy.call(this);
  };

})();
