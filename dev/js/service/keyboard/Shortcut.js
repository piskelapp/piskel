(function () {
  var ns = $.namespace('pskl.service.keyboard');

  /**
   * Keyboard shortcut wrapper, use it to register on the ShortcutService.
   *
   * @param {String} id          Shortcut identifier
   * @param {String} description Shortcut description
   * @param {String|Array<String>} defaultKeys  combination of modifiers + ([a-z0-9] or a special key)
   *                 Special keys are defined in KeycodeTranslator. If the shortcut supports several keys,
   *                 use an array of String keys
   */
  ns.Shortcut = function (id, description, defaultKeys, displayKey) {
    this.id_ = id;
    this.description_ = description;
    if (typeof defaultKeys === 'string') {
      defaultKeys = [defaultKeys];
    }
    this.defaultKeys_ = defaultKeys;
    this.displayKey_ = displayKey;
  };

  ns.Shortcut.USER_SETTINGS_PREFIX = 'shortcut.';

  ns.Shortcut.prototype.getId = function () {
    return this.id_;
  };

  ns.Shortcut.prototype.getDescription = function () {
    return this.description_;
  };

  /**
   * Retrieve the array of String keys that match this shortcut
   * @return {Array<String>} array of keys
   */
  ns.Shortcut.prototype.getKeys = function () {
    var keys = pskl.UserSettings.get(this.getLocalStorageKey_()) || this.defaultKeys_;

    if (typeof keys === 'string') {
      return [keys];
    }

    if (!Array.isArray(keys)) {
      return [];
    }

    return keys;
  };

  /**
   * For now, only shortcuts with a single key mapped can be edited
   * @return {Boolean} true if the shortcut can be updated
   */
  ns.Shortcut.prototype.isEditable = function () {
    if (this.getKeys().length === 0) {
      // No key defined: can be edited.
      return true;
    }

    if (this.getKeys().length === 1) {
      // Only one key defined, can be edited if it is not using a forbidden key.
      return ns.Shortcuts.FORBIDDEN_KEYS.indexOf(this.getKeys()[0]) === -1;
    }

    // More than one key, can't be edited.
    return false;
  };

  ns.Shortcut.prototype.isCustom = function () {
    var keys = this.getKeys();
    if (keys.length !== this.defaultKeys_.length) {
      return true;
    }

    // for some default keys
    return this.defaultKeys_.some(function (defaultKey) {
      // no match can be found in the current keys
      return !keys.some(function (key) {
        return ns.KeyUtils.equals(key, defaultKey);
      });
    });
  };

  ns.Shortcut.prototype.isUndefined = function () {
    return this.getKeys().length === 0;
  };

  /**
   * Get the key to be displayed for this shortcut, if
   * @return {[type]} [description]
   */
  ns.Shortcut.prototype.getDisplayKey = function () {
    if (this.isUndefined()) {
      return '???';
    }

    if (this.displayKey_) {
      return this.displayKey_;
    }

    return this.getKeys()[0];
  };

  ns.Shortcut.prototype.restoreDefault = function (keys) {
    pskl.UserSettings.set(this.getLocalStorageKey_(), '');
  };

  ns.Shortcut.prototype.updateKeys = function (keys) {
    pskl.UserSettings.set(this.getLocalStorageKey_(), keys);
  };

  ns.Shortcut.prototype.removeKeys = function (keysToRemove) {
    if (!this.isEditable()) {
      return;
    }

    var keys = this.getKeys();
    var updatedKeys = keys.filter(function (key) {
      return !keysToRemove.some(function (keyToRemove) {
        return ns.KeyUtils.equals(key, keyToRemove);
      });
    });

    if (updatedKeys.length !== keys.length) {
      this.updateKeys(updatedKeys);
      return true;
    }
    return false;
  };

  ns.Shortcut.prototype.getLocalStorageKey_ = function () {
    return ns.Shortcut.USER_SETTINGS_PREFIX + this.id_;
  };
})();
