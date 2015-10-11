(function () {
  var ns = $.namespace('pskl.service.keyboard');

  ns.ShortcutService = function () {
    this.shortcuts_ = [];
  };

  /**
   * @public
   */
  ns.ShortcutService.prototype.init = function() {
    $(document.body).keydown($.proxy(this.onKeyDown_, this));
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

  /**
   * @private
   */
  ns.ShortcutService.prototype.onKeyDown_ = function(evt) {
    var eventKey = ns.KeyUtils.createKeyFromEvent(evt);
    if (this.isInInput_(evt) || !eventKey) {
      return;
    }

    this.shortcuts_.forEach(function (shortcutInfo) {
      shortcutInfo.shortcut.getKeys().forEach(function (shortcutKey) {
        if (!ns.KeyUtils.equals(shortcutKey, eventKey)) {
          return;
        }

        var bubble = shortcutInfo.callback(eventKey.key);
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
})();
