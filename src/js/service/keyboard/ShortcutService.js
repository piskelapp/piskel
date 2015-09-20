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
   * @param {String}   rawKey   (case insensitive) a key is a combination of modifiers + ([a-z0-9] or
   *                            a special key) (check list of supported special keys in KeycodeTranslator)
   *                            eg. 'ctrl+A',
   *                                'del'
   *                                'ctrl+shift+S'
   * @param {Function} callback should return true to let the original event perform its default action
   */
  ns.ShortcutService.prototype.addShortcut = function (rawKey, callback) {
    var parsedKey = this.parseKey_(rawKey.toLowerCase());

    var key = parsedKey.key;
    var meta = parsedKey.meta;

    this.shortcuts_[key] = this.shortcuts_[key] || {};

    if (this.shortcuts_[key][meta]) {
      var keyStr = (meta !== 'normal' ? meta + ' + ' : '') + key;
      console.error('[ShortcutService] >>> Shortcut [' + keyStr + '] already registered');
    } else {
      this.shortcuts_[key][meta] = callback;
    }
  };

  ns.ShortcutService.prototype.addShortcuts = function (keys, callback) {
    keys.forEach(function (key) {
      this.addShortcut(key, callback);
    }.bind(this));
  };

  ns.ShortcutService.prototype.removeShortcut = function (rawKey) {
    var parsedKey = this.parseKey_(rawKey.toLowerCase());
    var key = parsedKey.key;
    var meta = parsedKey.meta;

    this.shortcuts_[key] = this.shortcuts_[key] || {};

    this.shortcuts_[key][meta] = null;
  };

  ns.ShortcutService.prototype.parseKey_ = function (key) {
    var meta = this.getMetaKey_({
      alt : key.indexOf('alt+') != -1,
      shift : key.indexOf('shift+') != -1,
      ctrl : key.indexOf('ctrl+') != -1
    });

    var parts = key.split(/\+(?!$)/);
    key = parts[parts.length - 1];
    return {meta : meta, key : key};
  };

  ns.ShortcutService.prototype.getMetaKey_ = function (meta) {
    var keyBuffer = [];
    ['alt', 'ctrl', 'shift'].forEach(function (metaKey) {
      if (meta[metaKey]) {
        keyBuffer.push(metaKey);
      }
    });

    if (keyBuffer.length > 0) {
      return keyBuffer.join('+');
    } else {
      return 'normal';
    }
  };

  /**
   * @private
   */
  ns.ShortcutService.prototype.onKeyUp_ = function(evt) {
    if (!this.isInInput_(evt)) {
      // jquery names FTW ...
      var keycode = evt.which;
      var charkey = pskl.service.keyboard.KeycodeTranslator.toChar(keycode);

      var keyShortcuts = this.shortcuts_[charkey];
      if (keyShortcuts) {
        var meta = this.getMetaKey_({
          alt : this.isAltKeyPressed_(evt),
          shift : this.isShiftKeyPressed_(evt),
          ctrl : this.isCtrlKeyPressed_(evt)
        });
        var cb = keyShortcuts[meta];

        if (cb) {
          var bubble = cb(charkey);
          if (bubble !== true) {
            evt.preventDefault();
          }
          $.publish(Events.KEYBOARD_EVENT, [evt]);
        }
      }
    }
  };

  ns.ShortcutService.prototype.isInInput_ = function (evt) {
    var targetTagName = evt.target.nodeName.toUpperCase();
    return targetTagName === 'INPUT' || targetTagName === 'TEXTAREA';
  };

  ns.ShortcutService.prototype.isCtrlKeyPressed_ = function (evt) {
    return pskl.utils.UserAgent.isMac ? evt.metaKey : evt.ctrlKey;
  };

  ns.ShortcutService.prototype.isShiftKeyPressed_ = function (evt) {
    return evt.shiftKey;
  };

  ns.ShortcutService.prototype.isAltKeyPressed_ = function (evt) {
    return evt.altKey;
  };
})();
