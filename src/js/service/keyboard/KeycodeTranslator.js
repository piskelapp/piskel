(function () {
  var specialKeys = {
    191 : '?',
    8 : 'back',
    27 : 'esc',
    38 : 'up',
    40 : 'down',
    46 : 'del',
    189 : '-',
    // 109 for numpad -
    109 : '-',
    // 173 on Firefox for minus key
    173 : '-',
    187 : '+',
    // 107 for numpad +
    107 : '+',
    // 61 on Firefox for =/+ key
    61 : '+',
    188 : '<',
    190 : '>'
  };

  var ns = $.namespace('pskl.service.keyboard');

  ns.KeycodeTranslator = {
    toChar : function (keycode) {
      if (keycode >= 48 && keycode <= 57) {
        // key is 0-9
        return (keycode - 48) + '';
      } else if (keycode >= 65 && keycode <= 90) {
        // key is a-z, use base 36 to get the string representation
        return (keycode - 65 + 10).toString(36);
      } else {
        return specialKeys[keycode];
      }
    }
  };
})();
