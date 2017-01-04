(function () {
  var ns = $.namespace('pskl.service');

  ns.SelectedColorsService = function () {
    this.primaryColor_ = Constants.DEFAULT_PEN_COLOR;
    this.secondaryColor_ = Constants.TRANSPARENT_COLOR;
  };

  ns.SelectedColorsService.prototype.init = function () {
    $.subscribe(Events.PRIMARY_COLOR_SELECTED, this.onPrimaryColorUpdate_.bind(this));
    $.subscribe(Events.SECONDARY_COLOR_SELECTED, this.onSecondaryColorUpdate_.bind(this));
  };

  ns.SelectedColorsService.prototype.getPrimaryColor = function () {
    return this.primaryColor_;
  };

  ns.SelectedColorsService.prototype.getSecondaryColor = function () {
    return this.secondaryColor_;
  };

  ns.SelectedColorsService.prototype.onPrimaryColorUpdate_ = function (evt, color) {
    this.primaryColor_ = color;
  };

  ns.SelectedColorsService.prototype.onSecondaryColorUpdate_ = function (evt, color) {
    this.secondaryColor_ = color;
  };
})();
