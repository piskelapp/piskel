(function () {
  var ns = $.namespace('pskl.model');

  ns.Palette = function (id, name, colors) {
    this.id = id;
    this.name = name;
    this.colors = colors;
  };

  ns.Palette.fromObject = function (paletteObj) {
    var colors = paletteObj.colors.slice(0 , paletteObj.colors.length);
    return new ns.Palette(paletteObj.id, paletteObj.name, colors);
  };

  ns.Palette.prototype.getColors = function () {
    return this.colors;
  };

  ns.Palette.prototype.setColors = function (colors) {
    this.colors = colors;
  };

  ns.Palette.prototype.get = function (index) {
    return this.colors[index];
  };

  ns.Palette.prototype.set = function (index, color) {
    this.colors[index] = color;
  };

  ns.Palette.prototype.add = function (color) {
    this.colors.push(color);
  };

  ns.Palette.prototype.size = function () {
    return this.colors.length;
  };

  ns.Palette.prototype.removeAt = function (index) {
    this.colors.splice(index, 1);
  };

  ns.Palette.prototype.move = function (oldIndex, newIndex) {
    this.colors.splice(newIndex, 0, this.colors.splice(oldIndex, 1)[0]);
  };
})();
