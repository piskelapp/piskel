(function () {
  var ns = $.namespace("pskl.controller.settings");

  var settings = {
    'user' : {
      template : 'templates/settings/application.html',
      controller : ns.ApplicationSettingsController
    },
    'gif' : {
      template : 'templates/settings/export-gif.html',
      controller : ns.GifExportController
    },
    'import' : {
      template : 'templates/settings/import.html',
      controller : ns.ImportController
    }
  };

  var SEL_SETTING_CLS = 'has-expanded-drawer';
  var EXP_DRAWER_CLS = 'expanded';

  ns.SettingsController = function (piskelController) {
    this.piskelController = piskelController;
    this.drawerContainer = document.getElementById("drawer-container");
    this.settingsContainer = $('[data-pskl-controller=settings]');
    this.expanded = false;
    this.currentSetting = null;
  };

  /**
   * @public
   */
  ns.SettingsController.prototype.init = function() {
    // Expand drawer when clicking 'Settings' tab.
    $('[data-setting]').click(function(evt) {
      var el = evt.originalEvent.currentTarget;
      var setting = el.getAttribute("data-setting");
      if (this.currentSetting != setting) {
        this.loadSetting(setting);
      } else {
        this.closeDrawer();
      }
    }.bind(this));

    $('body').click(function (evt) {
      var isInSettingsContainer = $.contains(this.settingsContainer.get(0), evt.target);
      if (this.expanded && !isInSettingsContainer) {
        this.closeDrawer();
      }
    }.bind(this));
  };

  ns.SettingsController.prototype.loadSetting = function (setting) {
    this.drawerContainer.innerHTML = pskl.utils.Template.get(settings[setting].template);
    (new settings[setting].controller(this.piskelController)).init();

    this.settingsContainer.addClass(EXP_DRAWER_CLS);

    $('.' + SEL_SETTING_CLS).removeClass(SEL_SETTING_CLS);
    $('[data-setting='+setting+']').addClass(SEL_SETTING_CLS);

    this.expanded = true;
    this.currentSetting = setting;
  };

  ns.SettingsController.prototype.closeDrawer = function () {
    this.settingsContainer.removeClass(EXP_DRAWER_CLS);
    $('.' + SEL_SETTING_CLS).removeClass(SEL_SETTING_CLS);

    this.expanded = false;
    this.currentSetting = null;
  };

})();