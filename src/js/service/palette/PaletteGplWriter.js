(function () {
  var ns = $.namespace('pskl.service.palette');

  ns.PaletteGplWriter = function (palette, onSuccess, onError) {
    this.palette = palette;
    this.onSuccess = onSuccess;
    this.onError = onError;
  };

  ns.PaletteGplWriter.prototype.write = function () {
    var lines = [];
    lines.push('GIMP Palette');
    lines.push('Name: ' + this.palette.name);
    lines.push('Columns: 0');
    lines.push('#');
    this.palette.colors.forEach(function (color) {
      lines.push(this.writeColorLine(color));
    }.bind(this));
    lines.push('\r\n');

    return lines.join('\r\n');
  };

  ns.PaletteGplWriter.prototype.writeColorLine = function (color) {
    var tinycolor = window.tinycolor(color);
    var rgb = tinycolor.toRgb();
    var strBuffer = [];
    strBuffer.push(this.padString(rgb.r, 3));
    strBuffer.push(this.padString(rgb.g, 3));
    strBuffer.push(this.padString(rgb.b, 3));
    strBuffer.push('Untitled');

    return strBuffer.join(' ');
  };

  ns.PaletteGplWriter.prototype.padString = function (str, size) {
    str = str.toString();
    for (var i = 0 ; i < size-str.length ; i++) {
      str = ' ' + str;
    }
    return str;
  };

})();

// GIMP Palette
// Name: Fabric_jeans
// Columns: 0
// #
// 194 198 201 Untitled
// 173 180 194 Untitled
// 123 126 145 Untitled
//  91 136 195 Untitled
//  41  52  74 Untitled
//  20  25  37 Untitled
// 164 156 145 Untitled
// 103  92  82 Untitled
//  87  58 107 Untitled
