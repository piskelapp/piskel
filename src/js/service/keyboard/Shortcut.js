(function () {
  var ns = $.namespace('pskl.service.keyboard');

  /**
   * Keyboard shortcut wrapper, use it to register on the ShortcutService.
   *
   * @param {String} id          Shortcut identifier
   * @param {String} description Shortcut description
   * @param {String|Array<String>} defaultKey  combination of modifiers + ([a-z0-9] or a special key)
   *                 Special keys are defined in KeycodeTranslator. If the shortcut supports several keys,
   *                 use an array of String keys
   */
  ns.Shortcut = function (id, description, defaultKey, displayKey) {
    this.id_ = id;
    this.description_ = description;
    this.defaultKey_ = defaultKey;
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
    var keys = pskl.UserSettings.get(ns.Shortcut.USER_SETTINGS_PREFIX + this.id_) || this.defaultKey_;
    if (typeof keys === 'string') {
      keys = [keys];
    }

    return keys;
  };

  /**
   * Get the key to be displayed for this shortcut, if
   * @return {[type]} [description]
   */
  ns.Shortcut.prototype.getKey = function () {
    if (this.displayKey_) {
      return this.displayKey_;
    }

    var keys = this.getKeys();
    if (Array.isArray(keys) && keys.length > 0) {
      return keys[0];
    }

    return '';
  };

})();
