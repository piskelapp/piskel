(function () {
  var ns = $.namespace('pskl.service.palette');

  ns.CurrentColorsPalette = function () {
    this.name = 'Current colors';
    this.id = Constants.CURRENT_COLORS_PALETTE_ID;
  };

  ns.CurrentColorsPalette.prototype.getColors = function () {
    return pskl.app.currentColorsService.getCurrentColors();
  };
})();