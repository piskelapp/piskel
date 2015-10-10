(function () {
  var ns = $.namespace('pskl.service.keyboard');

  ns.ShortcutService = function () {
    this.shortcuts_ = [];
  };

  /**
   * @public
   */
  ns.ShortcutService.prototype.init = function() {
    $(document.body).keydown($.proxy(this.onKeyUp_, this));
  };

  /**
   * Add a keyboard shortcut
   * @param {pskl.service.keyboard.Shortcut} shortcut
   * @param {Function} callback should return true to let the original event perform its default action
   */
  ns.ShortcutService.prototype.registerShortcut = function (shortcut, callback) {
    if (!(shortcut instanceof ns.Shortcut)) {
      throw 'Invalid shortcut argument, please use instances of pskl.service.keyboard.Shortcut';
    }

    if (typeof callback != 'function') {
      throw 'Invalid callback argument, please provide a function';
    }

    this.shortcuts_.push({
      shortcut : shortcut,
      callback : callback
    });
  };

  ns.ShortcutService.prototype.unregisterShortcut = function (shortcut) {
    var index = -1;
    this.shortcuts_.forEach(function (s, i) {
      if (s.shortcut === shortcut) {
        index = i;
      }
    });
    if (index != -1) {
      this.shortcuts_.splice(index, 1);
    }
  };

  ns.ShortcutService.prototype.parseKey_ = function (key) {
    var meta = this.getMetaKey_({
      alt : key.indexOf('alt+') != -1,
      shift : key.indexOf('shift+') != -1,
      ctrl : key.indexOf('ctrl+') != -1
    });

    var parts = key.split(/\+(?!$)/);
    key = parts[parts.length - 1];
    return {meta : meta, key : key.toLowerCase()};
  };

  /**
   * Retrieve a comparable representation of a meta information for a key
   * 'alt' 'ctrl' and 'shift' will always be in the same order for the same meta
   */
  ns.ShortcutService.prototype.getMetaKey_ = function (meta) {
    var keyBuffer = [];

    if (meta.alt) {
      keyBuffer.push('alt');
    }
    if (meta.ctrl) {
      keyBuffer.push('ctrl');
    }
    if (meta.shift) {
      keyBuffer.push('shift');
    }

    return keyBuffer.join('+') || 'normal';
  };

  /**
   * @private
   */
  ns.ShortcutService.prototype.onKeyUp_ = function(evt) {
    if (this.isInInput_(evt)) {
      return;
    }

    var keycode = evt.which;
    var eventKey = pskl.service.keyboard.KeycodeTranslator.toChar(keycode);
    var eventMeta = this.getMetaKey_({
      alt : evt.altKey,
      shift : evt.shiftKey,
      ctrl : this.isCtrlKeyPressed_(evt)
    });

    this.shortcuts_.forEach(function (shortcutInfo) {
      shortcutInfo.shortcut.getKeys().forEach(function (key) {
        if (!this.isKeyMatching_(key, eventKey, eventMeta)) {
          return;
        }

        var bubble = shortcutInfo.callback(eventKey);
        if (bubble !== true) {
          evt.preventDefault();
        }
        $.publish(Events.KEYBOARD_EVENT, [evt]);
      }.bind(this));
    }.bind(this));
  };

  ns.ShortcutService.prototype.isInInput_ = function (evt) {
    var targetTagName = evt.target.nodeName.toUpperCase();
    return targetTagName === 'INPUT' || targetTagName === 'TEXTAREA';
  };

  ns.ShortcutService.prototype.isKeyMatching_ = function (key, eventKey, eventMeta) {
    var parsedKey = this.parseKey_(key);
    return parsedKey.key === eventKey && parsedKey.meta === eventMeta;
  };

  ns.ShortcutService.prototype.isCtrlKeyPressed_ = function (evt) {
    return pskl.utils.UserAgent.isMac ? evt.metaKey : evt.ctrlKey;
  };
})();
