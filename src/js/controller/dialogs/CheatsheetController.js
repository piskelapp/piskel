(function () {
  var ns = $.namespace('pskl.controller.dialogs');

  ns.CheatsheetController = function () {};

  pskl.utils.inherit(ns.CheatsheetController, ns.AbstractDialogController);

  ns.CheatsheetController.prototype.init = function () {
    this.superclass.init.call(this);

    this.cheatsheetEl = document.getElementById('cheatsheetContainer');
    this.eventTrapInput = document.getElementById('cheatsheet-event-trap');

    pskl.utils.Event.addEventListener('.cheatsheet-restore-defaults', 'click', this.onRestoreDefaultsClick_, this);
    pskl.utils.Event.addEventListener(this.cheatsheetEl, 'click', this.onCheatsheetClick_, this);
    pskl.utils.Event.addEventListener(this.eventTrapInput, 'keydown', this.onEventTrapKeydown_, this);

    $.subscribe(Events.SHORTCUTS_CHANGED, this.onShortcutsChanged_.bind(this));

    this.initMarkup_();
  };

  ns.CheatsheetController.prototype.destroy = function () {
    this.eventTrapInput.blur();
    pskl.utils.Event.removeAllEventListeners();
    this.cheatsheetEl = null;
  };

  ns.CheatsheetController.prototype.onRestoreDefaultsClick_ = function () {
    pskl.service.keyboard.Shortcuts.restoreDefaultShortcuts();
  };

  ns.CheatsheetController.prototype.onShortcutsChanged_ = function () {
    this.initMarkup_();
  };

  ns.CheatsheetController.prototype.onCheatsheetClick_ = function (evt) {
    pskl.utils.Dom.removeClass('cheatsheet-shortcut-editing');

    var shortcutEl = pskl.utils.Dom.getParentWithData(evt.target, 'shortcutId');
    if (!shortcutEl) {
      return;
    }

    shortcutEl.classList.add('cheatsheet-shortcut-editing');
    this.eventTrapInput.focus();
  };

  ns.CheatsheetController.prototype.onEventTrapKeydown_ = function (evt) {
    var editedShortcutEl = document.querySelector('.cheatsheet-shortcut-editing');
    if (!editedShortcutEl) {
      return;
    }

    var shortcutKeyObject = pskl.service.keyboard.KeyUtils.createKeyFromEvent(evt);
    var shortcutKeyString = pskl.service.keyboard.KeyUtils.stringify(shortcutKeyObject);

    var shortcutId = editedShortcutEl.dataset.shortcutId;
    var shortcut = pskl.service.keyboard.Shortcuts.getShortcutById(shortcutId);
    pskl.service.keyboard.Shortcuts.updateShortcut(shortcut, shortcutKeyString);

    this.eventTrapInput.blur();

    evt.preventDefault();
  };

  ns.CheatsheetController.prototype.initMarkup_ = function () {
    this.initMarkupForCategory_('TOOL', '.cheatsheet-tool-shortcuts', this.getToolIconClass_);
    this.initMarkupForCategory_('MISC', '.cheatsheet-misc-shortcuts');
    this.initMarkupForCategory_('COLOR', '.cheatsheet-color-shortcuts');
    this.initMarkupForCategory_('SELECTION', '.cheatsheet-selection-shortcuts');
    this.initMarkupForCategory_('STORAGE', '.cheatsheet-storage-shortcuts');
  };

  ns.CheatsheetController.prototype.getToolIconClass_ = function (shortcut) {
    return 'tool-icon ' + shortcut.getId();
  };

  ns.CheatsheetController.prototype.initMarkupForCategory_ = function (category, container, iconClassProvider) {
    var shortcutMap = pskl.service.keyboard.Shortcuts[category];

    var descriptors = Object.keys(shortcutMap).map(function (shortcutKey) {
      return this.toDescriptor_(shortcutMap[shortcutKey], iconClassProvider);
    }.bind(this));

    this.initMarkupForDescriptors_(descriptors, container);
  };

  ns.CheatsheetController.prototype.toDescriptor_ = function (shortcut, iconClassProvider) {
    var iconClass = typeof iconClassProvider == 'function' ? iconClassProvider(shortcut) : '';
    return {
      'shortcut' : shortcut,
      'iconClass' : iconClass
    };
  };

  ns.CheatsheetController.prototype.initMarkupForDescriptors_ = function (descriptors, containerSelector) {
    var container = document.querySelector(containerSelector);
    if (!container) {
      return;
    }
    var markupArray = descriptors.map(this.getMarkupForDescriptor_.bind(this));
    container.innerHTML = markupArray.join('');
  };

  ns.CheatsheetController.prototype.getMarkupForDescriptor_ = function (descriptor) {
    var shortcutTemplate = pskl.utils.Template.get('cheatsheet-shortcut-template');
    var shortcut = descriptor.shortcut;
    var description = shortcut.isCustom() ? shortcut.getDescription() + ' *' : shortcut.getDescription();

    var shortcutClass = shortcut.isUndefined() ? 'cheatsheet-shortcut-undefined' : '';
    var markup = pskl.utils.Template.replace(shortcutTemplate, {
      shortcutId : shortcut.getId(),
      shortcutIcon : descriptor.iconClass,
      shortcutDescription : description,
      shortcutKey : this.formatKey_(shortcut.getDisplayKey()),
      shortcutClass : shortcutClass
    });

    return markup;
  };

  ns.CheatsheetController.prototype.formatKey_ = function (key) {
    if (pskl.utils.UserAgent.isMac) {
      key = key.replace('ctrl', 'cmd');
    }
    key = key.replace(/up/i, '&#65514;');
    key = key.replace(/down/i, '&#65516;');
    key = key.replace(/>/g, '&gt;');
    key = key.replace(/</g, '&lt;');
    // add spaces around '+' delimiters
    key = key.replace(/([^ ])\+([^ ])/g, '$1 + $2');
    return key;
  };
})();
