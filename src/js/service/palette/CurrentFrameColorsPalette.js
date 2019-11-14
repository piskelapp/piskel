(function () {
  var ns = $.namespace('pskl.service.palette');

  ns.CurrentFrameColorsPalette = function () {
    this.name = 'Current Frame colors';
    this.id = Constants.CURRENT_FRAME_COLORS_PALETTE_ID;
    this.colorSorter = new pskl.service.color.ColorSorter();
  };

  ns.CurrentFrameColorsPalette.prototype.getColors = function () {
    var currentColors = pskl.app.currentColorsService.getCurrentFrameColors();
    currentColors = currentColors.slice(0, Constants.MAX_PALETTE_COLORS);
    return currentColors;
  };
})();
