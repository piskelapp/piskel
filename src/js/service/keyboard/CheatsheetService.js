(function () {
  var ns = $.namespace('pskl.service.keyboard');

  /**
   * TODO : JD : This is not a service, but a controller
   * Moreover this should be handled by the DialogsController
   */
  ns.CheatsheetService = function () {
    this.isDisplayed = false;
    this.closePopupShortcut = pskl.service.keyboard.Shortcuts.MISC.CLOSE_POPUP;
  };

  ns.CheatsheetService.prototype.init = function () {
    this.cheatsheetLinkEl = document.querySelector('.cheatsheet-link');
    this.cheatsheetEl = document.getElementById('cheatsheet-wrapper');
    if (!this.cheatsheetEl) {
      throw 'cheatsheetEl DOM element could not be retrieved';
    }

    this.initMarkup_();

    var cheatsheetShortcut = pskl.service.keyboard.Shortcuts.MISC.CHEATSHEET;
    pskl.app.shortcutService.registerShortcut(cheatsheetShortcut, this.toggleCheatsheet_.bind(this));

    pskl.utils.Event.addEventListener(document.body, 'click', this.onBodyClick_, this);

    $.subscribe(Events.TOGGLE_HELP, this.toggleCheatsheet_.bind(this));
    $.subscribe(Events.ESCAPE, this.onEscape_.bind(this));
  };

  ns.CheatsheetService.prototype.onBodyClick_ = function (evt) {
    var isOnCheatsheet = this.cheatsheetEl.contains(evt.target);
    var isOnLink = this.cheatsheetLinkEl.contains(evt.target);
    if (isOnLink) {
      this.toggleCheatsheet_();
    } else if (!isOnCheatsheet) {
      this.hideCheatsheet_();
    }
  };

  ns.CheatsheetService.prototype.toggleCheatsheet_ = function () {
    if (this.isDisplayed) {
      this.hideCheatsheet_();
    } else {
      this.showCheatsheet_();
    }
  };

  ns.CheatsheetService.prototype.onEscape_ = function () {
    if (this.isDisplayed) {
      this.hideCheatsheet_();
    }
  };

  ns.CheatsheetService.prototype.showCheatsheet_ = function () {
    pskl.app.shortcutService.registerShortcut(this.closePopupShortcut, this.hideCheatsheet_.bind(this));
    this.cheatsheetEl.style.display = 'block';
    this.isDisplayed = true;
  };

  ns.CheatsheetService.prototype.hideCheatsheet_ = function () {
    pskl.app.shortcutService.unregisterShortcut(this.closePopupShortcut);
    this.cheatsheetEl.style.display = 'none';
    this.isDisplayed = false;
  };

  ns.CheatsheetService.prototype.initMarkup_ = function () {
    this.initMarkupForTools_();
    this.initMarkupForMisc_();
    this.initMarkupForColors_();
    this.initMarkupForSelection_();
  };

  ns.CheatsheetService.prototype.initMarkupForTools_ = function () {
    var descriptors = this.createShortcutDescriptors_(ns.Shortcuts.TOOL, this.getToolShortcutClassname_);
    this.initMarkupForDescriptors_(descriptors, '.cheatsheet-tool-shortcuts');
  };

  ns.CheatsheetService.prototype.getToolShortcutClassname_ = function (shortcut) {
    return 'tool-icon ' + shortcut.getId();
  };

  ns.CheatsheetService.prototype.initMarkupForMisc_ = function () {
    var descriptors = this.createShortcutDescriptors_(ns.Shortcuts.MISC);
    this.initMarkupForDescriptors_(descriptors, '.cheatsheet-misc-shortcuts');
  };

  ns.CheatsheetService.prototype.initMarkupForColors_ = function () {
    var descriptors = this.createShortcutDescriptors_(ns.Shortcuts.COLOR);
    this.initMarkupForDescriptors_(descriptors, '.cheatsheet-colors-shortcuts');
  };

  ns.CheatsheetService.prototype.initMarkupForSelection_ = function () {
    var descriptors = this.createShortcutDescriptors_(ns.Shortcuts.SELECTION);
    this.initMarkupForDescriptors_(descriptors, '.cheatsheet-selection-shortcuts');
  };

  ns.CheatsheetService.prototype.createShortcutDescriptors_ = function (shortcutMap, classnameProvider) {
    return Object.keys(shortcutMap).map(function (shortcutKey) {
      var shortcut = shortcutMap[shortcutKey];
      var classname = typeof classnameProvider == 'function' ? classnameProvider(shortcut) : '';
      return this.toDescriptor_(shortcut.getKey(), shortcut.getDescription(), classname);
    }.bind(this));
  };

  ns.CheatsheetService.prototype.toDescriptor_ = function (key, description, icon) {
    if (pskl.utils.UserAgent.isMac) {
      key = key.replace('ctrl', 'cmd');
    }
    key = key.replace('up', '&#65514;');
    key = key.replace('down', '&#65516;');
    key = key.replace(/>/g, '&gt;');
    key = key.replace(/</g, '&lt;');
    key = key.replace(/^(.*[^ ])\+([^ ].*)$/g, '$1 + $2');

    return {
      'key' : key,
      'description' : description,
      'icon' : icon
    };
  };

  ns.CheatsheetService.prototype.initMarkupForDescriptors_ = function (descriptors, containerSelector) {
    var container = this.cheatsheetEl.querySelector(containerSelector);
    descriptors.forEach(function (descriptor) {
      var shortcut = this.getDomFromDescriptor_(descriptor);
      container.appendChild(shortcut);
    }.bind(this));
  };

  ns.CheatsheetService.prototype.getDomFromDescriptor_ = function (descriptor) {
    var shortcutTemplate = pskl.utils.Template.get('cheatsheet-shortcut-template');
    var markup = pskl.utils.Template.replace(shortcutTemplate, {
      shortcutIcon : descriptor.icon,
      shortcutDescription : descriptor.description,
      shortcutKey : descriptor.key
    });

    return pskl.utils.Template.createFromHTML(markup);
  };

})();
