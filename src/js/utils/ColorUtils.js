(function () {
  var ns = $.namespace('pskl.utils');

  ns.ColorUtils = {
    getUnusedColor : function (usedColors) {
      usedColors = usedColors || [];
      // create check map
      var colorMap = {};
      usedColors.forEach(function (color) {
        colorMap[color.toUpperCase()] = true;
      });

      // start with white
      var color = {
        r : 255,
        g : 255,
        b : 0
      };
      var match = null;
      while (true) {
        var hex = window.tinycolor(color).toHexString().toUpperCase();

        if (!colorMap[hex]) {
          match = hex;
          break;
        } else {
          // pick a non null component to decrease its value
          var component = (color.r && 'r') || (color.g && 'g') || (color.b && 'b');
          if (component) {
            color[component] = color[component] - 1;
          } else {
            // no component available, no match found
            break;
          }
        }
      }

      return match;
    }
  };
})();
