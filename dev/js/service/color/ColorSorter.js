(function () {
  var ns = $.namespace('pskl.service.color');

  var LOW_SAT = 0.1;
  var LOW_LUM = 0.1;
  var HI_LUM = 0.9;

  var HUE_STEP = 36;
  var HUE_BAGS = 10;
  var HUE_BOUNDS = [];
  for (var i = 0 ; i < HUE_BAGS ; i++) {
    HUE_BOUNDS.push(i * HUE_STEP);
  }

  ns.ColorSorter = function () {
    this.colorsHslMap_ = {};
  };

  ns.ColorSorter.prototype.sort = function (colors) {
    this.colorsHslMap_ = {};

    colors.forEach(function (color) {
      this.colorsHslMap_[color] = window.tinycolor(color).toHsl();
    }.bind(this));

    // sort by most frequent color
    var darkColors = colors.filter(function (c) {
      var hsl = this.colorsHslMap_[c];
      return hsl.l <= LOW_LUM;
    }.bind(this));

    var brightColors = colors.filter(function (c) {
      var hsl = this.colorsHslMap_[c];
      return hsl.l >= HI_LUM;
    }.bind(this));

    var desaturatedColors = colors.filter(function (c) {
      return brightColors.indexOf(c) === -1 && darkColors.indexOf(c) === -1;
    }).filter(function (c) {
      var hsl = this.colorsHslMap_[c];
      return hsl.s <= LOW_SAT;
    }.bind(this));

    darkColors = this.sortOnHslProperty_(darkColors, 'l');
    brightColors = this.sortOnHslProperty_(brightColors, 'l');
    desaturatedColors = this.sortOnHslProperty_(desaturatedColors, 'h');

    var sortedColors = darkColors.concat(brightColors, desaturatedColors);

    var regularColors = colors.filter(function (c) {
      return sortedColors.indexOf(c) === -1;
    });

    var regularColorsBags = HUE_BOUNDS.map(function (hue) {
      var bagColors = regularColors.filter(function (color) {
        var hsl = this.colorsHslMap_[color];
        return (hsl.h >= hue && hsl.h < hue + HUE_STEP);
      }.bind(this));

      return this.sortRegularColors_(bagColors);
    }.bind(this));

    return Array.prototype.concat.apply(sortedColors, regularColorsBags);
  };

  ns.ColorSorter.prototype.sortRegularColors_ = function (colors) {
    var sortedColors = colors.sort(function (c1, c2) {
      var hsl1 = this.colorsHslMap_[c1];
      var hsl2 = this.colorsHslMap_[c2];
      var hDiff = Math.abs(hsl1.h - hsl2.h);
      var sDiff = Math.abs(hsl1.s - hsl2.s);
      var lDiff = Math.abs(hsl1.l - hsl2.l);
      if (hDiff < 10) {
        if (sDiff > lDiff) {
          return this.compareValues_(hsl1.s, hsl2.s);
        } else {
          return this.compareValues_(hsl1.l, hsl2.l);
        }
      } else {
        return this.compareValues_(hsl1.h, hsl2.h);
      }
    }.bind(this));

    return sortedColors;
  };

  ns.ColorSorter.prototype.sortOnHslProperty_ = function (colors, property) {
    return colors.sort(function (c1, c2) {
      var hsl1 = this.colorsHslMap_[c1];
      var hsl2 = this.colorsHslMap_[c2];
      return this.compareValues_(hsl1[property], hsl2[property]);
    }.bind(this));
  };

  ns.ColorSorter.prototype.compareValues_ = function (v1, v2) {
    if (v1 > v2) {
      return 1;
    } else if (v1 < v2) {
      return -1;
    }
    return 0;
  };

})();
