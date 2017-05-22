(function () {
  var ns = $.namespace('pskl.service.keyboard');

  ns.KeyUtils = {
    createKeyFromString : function (shortcutKeyString) {
      shortcutKeyString = shortcutKeyString.toLowerCase();
      var modifiers = {
        alt : shortcutKeyString.indexOf('alt+') != -1,
        shift : shortcutKeyString.indexOf('shift+') != -1,
        ctrl : shortcutKeyString.indexOf('ctrl+') != -1
      };

      var parts = shortcutKeyString.split(/\+(?!$)/);
      var key = parts[parts.length - 1];

      return {
        key : key.toUpperCase(),
        modifiers : modifiers
      };
    },

    createKeyFromEvent : function (evt) {
      var keycode = evt.which;
      var key = ns.KeycodeTranslator.toChar(keycode);
      if (!key) {
        return null;
      }

      return {
        key : key.toUpperCase(),
        modifiers : {
          alt : evt.altKey,
          shift : evt.shiftKey,
          ctrl : ns.KeyUtils.isCtrlKeyPressed_(evt)
        }
      };
    },

    equals : function (key1, key2) {
      key1 = typeof key1 === 'string' ? ns.KeyUtils.createKeyFromString(key1) : key1;
      key2 = typeof key2 === 'string' ? ns.KeyUtils.createKeyFromString(key2) : key2;

      var isKeyMatching = key1.key === key2.key &&
        key1.modifiers.alt === key2.modifiers.alt &&
        key1.modifiers.shift === key2.modifiers.shift &&
        key1.modifiers.ctrl === key2.modifiers.ctrl;

      return isKeyMatching;
    },

    stringify : function (shortcutKeyObject) {
      var modifierString = ns.KeyUtils.getModifiersString(shortcutKeyObject.modifiers);
      if (modifierString) {
        return modifierString + '+' + shortcutKeyObject.key;
      }

      return shortcutKeyObject.key;
    },

    getModifiersString : function (modifiers) {
      var keyBuffer = [];

      if (modifiers.alt) {
        keyBuffer.push('alt');
      }
      if (modifiers.ctrl) {
        keyBuffer.push('ctrl');
      }
      if (modifiers.shift) {
        keyBuffer.push('shift');
      }

      return keyBuffer.join('+');
    },

    isCtrlKeyPressed_ : function (evt) {
      return pskl.utils.UserAgent.isMac ? evt.metaKey : evt.ctrlKey;
    }
  };
})();
