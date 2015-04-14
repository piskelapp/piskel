(function () {
  var ns = $.namespace('pskl.service.palette');

  ns.CurrentColorsPalette = function () {
    this.name = 'Current colors';
    this.id = Constants.CURRENT_COLORS_PALETTE_ID;
    this.colorSorter = new pskl.service.color.ColorSorter();
  };

  ns.CurrentColorsPalette.prototype.getColors = function () {
    var currentColors = pskl.app.currentColorsService.getCurrentColors();
    currentColors = currentColors.slice(0, Constants.MAX_PALETTE_COLORS);
    return this.colorSorter.sort(currentColors);
  };
})();
