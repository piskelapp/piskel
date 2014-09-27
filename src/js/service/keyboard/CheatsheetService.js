(function () {
  var ns = $.namespace('pskl.service.keyboard');

  ns.CheatsheetService = function () {
    this.isDisplayed_ = false;
  };

  ns.CheatsheetService.prototype.init = function () {
    this.cheatsheetEl_ = document.getElementById('cheatsheet-wrapper');
    if (!this.cheatsheetEl_) {
      throw 'cheatsheetEl_ DOM element could not be retrieved';
    }
    this.initMarkup_();
    pskl.app.shortcutService.addShortcuts(['?', 'shift+?'], this.toggleCheatsheet_.bind(this));

    var link = $('.cheatsheet-link');
    link.click(this.toggleCheatsheet_.bind(this));


    $.subscribe(Events.TOGGLE_HELP, this.toggleCheatsheet_.bind(this));
    $.subscribe(Events.ESCAPE, this.onEscape_.bind(this));
  };

  ns.CheatsheetService.prototype.toggleCheatsheet_ = function () {
    if (this.isDisplayed_) {
      this.hideCheatsheet_();
    } else {
      this.showCheatsheet_();
    }
  };

  ns.CheatsheetService.prototype.onEscape_ = function () {
    if (this.isDisplayed_) {
      this.hideCheatsheet_();
    }
  };

  ns.CheatsheetService.prototype.showCheatsheet_ = function () {
    pskl.app.shortcutService.addShortcut('ESC', this.hideCheatsheet_.bind(this));
    this.cheatsheetEl_.style.display = 'block';
    this.isDisplayed_ = true;
  };


  ns.CheatsheetService.prototype.hideCheatsheet_ = function () {
    pskl.app.shortcutService.removeShortcut('ESC');
    this.cheatsheetEl_.style.display = 'none';
    this.isDisplayed_ = false;
  };

  ns.CheatsheetService.prototype.initMarkup_ = function () {
    this.initMarkupForTools_();
    this.initMarkupForMisc_();
    this.initMarkupForSelection_();
  };

  ns.CheatsheetService.prototype.toDescriptor_ = function (shortcut, description, icon) {
    if (pskl.utils.UserAgent.isMac) {
      shortcut = shortcut.replace('ctrl', 'cmd');
    }
    return {
      'shortcut' : shortcut,
      'description' : description,
      'icon' : icon
    };
  };

  ns.CheatsheetService.prototype.getDomFromDescriptor_ = function (descriptor) {
    var shortcutTemplate = pskl.utils.Template.get('cheatsheet-shortcut-template');
    var markup = pskl.utils.Template.replace(shortcutTemplate, {
      shortcutIcon : descriptor.icon,
      shortcutDescription : descriptor.description,
      shortcutKey : descriptor.shortcut
    });

    return pskl.utils.Template.createFromHTML(markup);
  };

  ns.CheatsheetService.prototype.initMarkupAbstract_ = function (descriptors, containerSelector) {
    var container = $(containerSelector, this.cheatsheetEl_).get(0);
    for (var i = 0 ; i < descriptors.length ; i++) {
      var descriptor = descriptors[i];
      var shortcutEl = this.getDomFromDescriptor_(descriptor);
      container.appendChild(shortcutEl);
    }
  };

  ns.CheatsheetService.prototype.initMarkupForTools_ = function () {
    var descriptors = pskl.app.toolController.tools.map(function (tool) {
      return this.toDescriptor_(tool.shortcut, tool.instance.getHelpText(), 'tool-icon ' + tool.instance.toolId);
    }.bind(this));

    this.initMarkupAbstract_(descriptors, '.cheatsheet-tool-shortcuts');
  };

  ns.CheatsheetService.prototype.initMarkupForMisc_ = function () {
    var descriptors = [
      this.toDescriptor_('0', 'Reset zoom level'),
      this.toDescriptor_('+/-', 'Zoom in/Zoom out'),
      this.toDescriptor_('X', 'Swap primary/secondary colors'),
      this.toDescriptor_('D', 'Reset default colors'),
      this.toDescriptor_('ctrl + Z', 'Undo'),
      this.toDescriptor_('ctrl + Y', 'Redo'),
      this.toDescriptor_('&#65514;', 'Select previous frame'), /* ASCII for up-arrow */
      this.toDescriptor_('&#65516;', 'Select next frame'), /* ASCII for down-arrow */
      this.toDescriptor_('N', 'Create new frame'),
      this.toDescriptor_('shift + N', 'Duplicate selected frame'),
      this.toDescriptor_('shift + ?', 'Open/Close this popup'),
      this.toDescriptor_('alt + P', 'Create a Palette'),
      this.toDescriptor_('&lt;/&gt;', 'Select previous/next palette color'),
      this.toDescriptor_('alt + O', 'Toggle Onion Skin'),
      this.toDescriptor_('alt + L', 'Toggle Layer Preview')
    ];

    this.initMarkupAbstract_(descriptors, '.cheatsheet-misc-shortcuts');
  };

  ns.CheatsheetService.prototype.initMarkupForSelection_ = function () {
    var descriptors = [
      this.toDescriptor_('ctrl + X', 'Cut selection'),
      this.toDescriptor_('ctrl + C', 'Copy selection'),
      this.toDescriptor_('ctrl + V', 'Paste selection'),
      this.toDescriptor_('del', 'Delete selection')
    ];

    this.initMarkupAbstract_(descriptors, '.cheatsheet-selection-shortcuts');
  };

})();
