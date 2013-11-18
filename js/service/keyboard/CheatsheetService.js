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
    $.subscribe(Events.TOGGLE_HELP, this.toggleCheatsheet_.bind(this));
  };

  ns.CheatsheetService.prototype.toggleCheatsheet_ = function () {
    if (this.isDisplayed_) {
      this.hideCheatsheet_();
    } else {
      this.showCheatsheet_();
    }
  };

  ns.CheatsheetService.prototype.showCheatsheet_ = function () {
    this.cheatsheetEl_.style.display = 'block';
    this.isDisplayed_ = true;
  };


  ns.CheatsheetService.prototype.hideCheatsheet_ = function () {
    this.cheatsheetEl_.style.display = 'none';
    this.isDisplayed_ = false;
  };

  ns.CheatsheetService.prototype.initMarkup_ = function () {
    this.initMarkupForTools_();


  };

  ns.CheatsheetService.prototype.initMarkupForTools_ = function () {
    var shortcutTemplate = pskl.utils.Template.get('cheatsheet-shortcut-template');

    var toolShortcutsContainer = $('.cheatsheet-tool-shortcuts', this.cheatsheetEl_).get(0);
    var tools = pskl.app.toolController.tools;
    for (var i = 0 ; i < tools.length ; i++) {
      var tool = tools[i];
      var shortcutEl = pskl.utils.Template.createFromHTML(
        pskl.utils.Template.replace(shortcutTemplate, {
          shortcutIcon : 'tool-icon ' + tool.instance.toolId,
          shortcutDescription : tool.instance.helpText,
          shortcutKey : tool.shortcut
        })
      );
      toolShortcutsContainer.appendChild(shortcutEl);
    }
  };

  this.initMarkupForMisc_ = function () {
    var shortcutTemplate = pskl.utils.Template.get('cheatsheet-shortcut-template');

    var miscShortcutsContainer = $('.cheatsheet-misc-shortcuts', this.cheatsheetEl_).get(0);
    var toDescriptor = function (shortcut, description) {
      return {shortcut:shortcut, description:description};
    };
    var miscKeys = [
      toDescriptor('X', 'Swap primary/secondary colors'),
      toDescriptor('ctrl + X', 'Cut selection'),
      toDescriptor('ctrl + C', 'Copy selection'),
      toDescriptor('ctrl + V', 'Paste selection'),
      toDescriptor('ctrl + Z', 'Undo'),
      toDescriptor('ctrl + Y', 'Redo')
    ];
    for (var i = 0 ; i < miscKeys.length ; i++) {
      var key = miscKeys[i];
      var shortcutEl = pskl.utils.Template.createFromHTML(
        pskl.utils.Template.replace(shortcutTemplate, {
          shortcutIcon : '',
          shortcutDescription : key.description,
          shortcutKey : key.shortcut
        })
      );
      miscShortcutsContainer.appendChild(shortcutEl);
    }
  };

})();