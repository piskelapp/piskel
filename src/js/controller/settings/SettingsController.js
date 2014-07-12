(function () {
  var ns = $.namespace('pskl.controller.settings');

  var settings = {
    'user' : {
      template : 'templates/settings/application.html',
      controller : ns.ApplicationSettingsController
    },
    'resize' : {
      template : 'templates/settings/resize.html',
      controller : ns.ResizeController
    },
    'export' : {
      template : 'templates/settings/export.html',
      controller : ns.ImageExportController
    },
    'import' : {
      template : 'templates/settings/import.html',
      controller : ns.ImportController
    },
    'localstorage' : {
      template : 'templates/settings/localstorage.html',
      controller : ns.LocalStorageController
    },
    'save' : {
      template : 'templates/settings/save.html',
      controller : ns.SaveController
    }
  };

  var SEL_SETTING_CLS = 'has-expanded-drawer';
  var EXP_DRAWER_CLS = 'expanded';

  ns.SettingsController = function (piskelController) {
    this.piskelController = piskelController;
    this.drawerContainer = document.getElementById('drawer-container');
    this.settingsContainer = $('[data-pskl-controller=settings]');
    this.isExpanded = false;
    this.currentSetting = null;
  };

  /**
   * @public
   */
  ns.SettingsController.prototype.init = function() {
    $('[data-setting]').click(this.onSettingIconClick.bind(this));
    $('body').click(this.onBodyClick.bind(this));
    $.subscribe(Events.CLOSE_SETTINGS_DRAWER, this.closeDrawer.bind(this));
  };

  ns.SettingsController.prototype.onSettingIconClick = function (evt) {
    var el = evt.originalEvent.currentTarget;
    var setting = el.getAttribute('data-setting');
    if (this.currentSetting != setting) {
      this.loadSetting(setting);
    } else {
      this.closeDrawer();
    }
    evt.originalEvent.stopPropagation();
    evt.originalEvent.preventDefault();
  };

  ns.SettingsController.prototype.onBodyClick = function (evt) {
    var target = evt.target;

    var isInDrawerContainer = pskl.utils.Dom.isParent(target, this.drawerContainer);
    var isInSettingsIcon = target.getAttribute('data-setting');
    var isInSettingsContainer = isInDrawerContainer || isInSettingsIcon;

    if (this.isExpanded && !isInSettingsContainer) {
      this.closeDrawer();
    }
  };

  ns.SettingsController.prototype.loadSetting = function (setting) {
    this.drawerContainer.innerHTML = pskl.utils.Template.get(settings[setting].template);
    (new settings[setting].controller(this.piskelController)).init();

    this.settingsContainer.addClass(EXP_DRAWER_CLS);

    $('.' + SEL_SETTING_CLS).removeClass(SEL_SETTING_CLS);
    $('[data-setting='+setting+']').addClass(SEL_SETTING_CLS);

    this.isExpanded = true;
    this.currentSetting = setting;
  };

  ns.SettingsController.prototype.closeDrawer = function () {
    this.settingsContainer.removeClass(EXP_DRAWER_CLS);
    $('.' + SEL_SETTING_CLS).removeClass(SEL_SETTING_CLS);

    this.isExpanded = false;
    this.currentSetting = null;

    document.activeElement.blur();
  };

})();