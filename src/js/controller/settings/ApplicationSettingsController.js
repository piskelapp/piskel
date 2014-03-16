(function () {
  var ns = $.namespace("pskl.controller.settings");

  ns.ApplicationSettingsController = function () {};

  /**
   * @public
   */
  ns.ApplicationSettingsController.prototype.init = function() {
    // Highlight selected background picker:
    var backgroundClass = pskl.UserSettings.get(pskl.UserSettings.CANVAS_BACKGROUND);
    $('#background-picker-wrapper')
      .find('.background-picker[data-background-class=' + backgroundClass + ']')
      .addClass('selected');

    // Grid display and size
    var gridWidth = pskl.UserSettings.get(pskl.UserSettings.GRID_WIDTH);
    $('#grid-width').val(gridWidth);
    $('#grid-width').change(this.onGridWidthChange.bind(this));

    // Handle canvas background changes:
    $('#background-picker-wrapper').click(this.onBackgroundClick.bind(this));
  };

  ns.ApplicationSettingsController.prototype.onGridWidthChange = function (evt) {
    var width = $('#grid-width').val();
    pskl.UserSettings.set(pskl.UserSettings.GRID_WIDTH, parseInt(width, 10));
  };

  ns.ApplicationSettingsController.prototype.onBackgroundClick = function (evt) {
    var target = $(evt.target).closest('.background-picker');
    if (target.length) {
      var backgroundClass = target.data('background-class');
      pskl.UserSettings.set(pskl.UserSettings.CANVAS_BACKGROUND, backgroundClass);

      $('.background-picker').removeClass('selected');
      target.addClass('selected');
    }
  };

})();