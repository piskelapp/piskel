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

    // Initial state for grid display:
    var show_grid = pskl.UserSettings.get(pskl.UserSettings.SHOW_GRID);
    $('#show-grid').prop('checked', show_grid);

    // Handle grid display changes:
    $('#show-grid').change(this.onShowGridClick.bind(this));

    // Handle canvas background changes:
    $('#background-picker-wrapper').click(this.onBackgroundClick.bind(this));
  };

  ns.ApplicationSettingsController.prototype.onShowGridClick = function (evt) {
    var checked = $('#show-grid').prop('checked');
    pskl.UserSettings.set(pskl.UserSettings.SHOW_GRID, checked);
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