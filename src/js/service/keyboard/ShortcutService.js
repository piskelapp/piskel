(function () {
  var ns = $.namespace('pskl.service.keyboard');

  ns.ShortcutService = function () {
    this.shortcuts_ = {};
  };

  /**
   * @public
   */
  ns.ShortcutService.prototype.init = function() {
    $(document.body).keydown($.proxy(this.onKeyUp_, this));
  };

  /**
   * Add a keyboard shortcut
   * @param {String}   rawKey   (case insensitive) key can be a meta (optional) + [a-z0-9] or
   *                            a special key (check list of supported keys in KeycodeTranslator)
   *                            eg. 'ctrl+A', 'del'
   * @param {Function} callback should return true to let the original event perform its default action
   */
  ns.ShortcutService.prototype.addShortcut = function (rawKey, callback) {
    var parsedKey = this.parseKey_(rawKey.toLowerCase());

    var key = parsedKey.key,
      meta = parsedKey.meta;

    this.shortcuts_[key] = this.shortcuts_[key] || {};

    if (this.shortcuts_[key][meta]) {
      var keyStr = (meta !== 'normal' ? meta + ' + ' : '') + key;
      console.error('[ShortcutService] >>> Shortcut [' + keyStr + '] already registered');
    } else {
      this.shortcuts_[key][meta] = callback;
    }
  };

  ns.ShortcutService.prototype.removeShortcut = function (rawKey) {
    var parsedKey = this.parseKey_(rawKey.toLowerCase());

    var key = parsedKey.key,
      meta = parsedKey.meta;

    this.shortcuts_[key] = this.shortcuts_[key] || {};

    this.shortcuts_[key][meta] = null;
  };

  ns.ShortcutService.prototype.parseKey_ = function (key) {
    var meta = 'normal';
    if (key.indexOf('ctrl+') === 0) {
      meta = 'ctrl';
      key = key.replace('ctrl+', '');
    } else if (key.indexOf('shift+') === 0) {
      meta = 'shift';
      key = key.replace('shift+', '');
    } else if (key.indexOf('alt+') === 0) {
      meta = 'alt';
      key = key.replace('alt+', '');
    }
    return {meta : meta, key : key};
  };

  /**
   * @private
   */
  ns.ShortcutService.prototype.onKeyUp_ = function(evt) {
    if (!this.isInInput_(evt)) {
      // jquery names FTW ...
      var keycode = evt.which;
      var targetTagName = evt.target.nodeName.toUpperCase();
      var charkey = pskl.service.keyboard.KeycodeTranslator.toChar(keycode);

      var keyShortcuts = this.shortcuts_[charkey];
      if(keyShortcuts) {
        var cb;
        if (this.isCtrlKeyPressed_(evt)) {
          cb = keyShortcuts.ctrl;
        } else if (this.isShiftKeyPressed_(evt)) {
          cb = keyShortcuts.shift;
        } else if (this.isAltKeyPressed_(evt)) {
          cb = keyShortcuts.alt;
        } else {
          cb = keyShortcuts.normal;
        }

        if(cb) {
          var bubble = cb(charkey);
          if (bubble !== true) {
            evt.preventDefault();
          }
        }
      }
    }
  };

  ns.ShortcutService.prototype.isInInput_ = function (evt) {
    var targetTagName = evt.target.nodeName.toUpperCase();
    return targetTagName === 'INPUT' || targetTagName === 'TEXTAREA';
  };

  ns.ShortcutService.prototype.isCtrlKeyPressed_ = function (evt) {
    return this.isMac_() ? evt.metaKey : evt.ctrlKey;
  };

  ns.ShortcutService.prototype.isShiftKeyPressed_ = function (evt) {
    return evt.shiftKey;
  };

  ns.ShortcutService.prototype.isAltKeyPressed_ = function (evt) {
    return evt.altKey;
  };

  ns.ShortcutService.prototype.isMac_ = function () {
    return navigator.appVersion.indexOf("Mac") != -1;
  };
})();