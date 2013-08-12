(function () {
  var ns = $.namespace("pskl.controller");
  
  var settings = {
    user : {
      template : 'templates/settings-application.html',
      controller : ns.settings.ApplicationSettingsController
    },
    gif : {
      template : 'templates/settings-export-gif.html',
      controller : ns.settings.GifExportController
    }
  };

  var SEL_SETTING_CLS = 'has-expanded-drawer';
  var EXP_DRAWER_CLS = 'expanded';

  ns.SettingsController = function () {
    this.drawerContainer = document.getElementById("drawer-container");
    this.settingsContainer = $('.right-sticky-section');
    this.expanded = false;
    this.currentSetting = null;
  };

  /**
   * @public
   */
  ns.SettingsController.prototype.init = function() {
    // Expand drawer when clicking 'Settings' tab.
    $('[data-setting]').click(function(evt) {
      var el = event.currentTarget;
      var setting = el.dataset.setting;
      if (this.currentSetting != setting) {
        this.loadSetting(setting);
      } else {
        this.closeDrawer();
      }
    }.bind(this));
  };

  ns.SettingsController.prototype.loadSetting = function (setting) {
    this.drawerContainer.innerHTML = this.getTemplate_(settings[setting].template);
    (new settings[setting].controller()).init();
    
    this.settingsContainer.addClass(EXP_DRAWER_CLS);
    
    $('.' + SEL_SETTING_CLS).removeClass(SEL_SETTING_CLS);
    $('[data-setting='+setting+']').addClass(SEL_SETTING_CLS);

    this.currentSetting = setting;
  };

  ns.SettingsController.prototype.closeDrawer = function () {
    this.settingsContainer.removeClass(EXP_DRAWER_CLS);
    $('.' + SEL_SETTING_CLS).removeClass(SEL_SETTING_CLS);

    this.currentSetting = null;
  };

  ns.SettingsController.prototype.getTemplate_ = function (templateId) {
    var template = document.getElementById(templateId);
    if (template) {
      return template.innerHTML;
    } else {
      console.error("Could not find template for id :", templateId);
    }
  };
  
})();