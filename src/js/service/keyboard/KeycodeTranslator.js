(function () {
  var specialKeys = {
    8 : 'back',
    13 : 'enter',
    27 : 'esc',
    32 : 'space',
    37 : 'left',
    38 : 'up',
    39 : 'right',
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
    190 : '>',
    191 : '?',
    219 : '[',
    221 : ']'
  };

  var ns = $.namespace('pskl.service.keyboard');

  ns.KeycodeTranslator = {
    toChar : function (keycode) {
      if (keycode >= 48 && keycode <= 57) {
        // key is 0-9
        return (keycode - 48) + '';
      } else if (keycode >= 96 && keycode <= 105) {
        // key is numpad 0-9
        return (keycode - 96) + '';
      } else if (keycode >= 65 && keycode <= 90) {
        // key is a-z, use base 36 to get the string representation
        return (keycode - 65 + 10).toString(36);
      } else {
        return specialKeys[keycode];
      }
    }
  };
})();
