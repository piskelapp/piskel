(function () {
  var ns = $.namespace('pskl.controller.settings.application');

  ns.GridApplicationController = function (piskelController, applicationController) {
    this.piskelController = piskelController;
    this.applicationController = applicationController;
  };

  pskl.utils.inherit(ns.GridApplicationController, pskl.controller.settings.AbstractSettingController);

  ns.GridApplicationController.prototype.init = function () {
    // Grid display and size
    var gridWidth = pskl.UserSettings.get(pskl.UserSettings.GRID_WIDTH);
    var gridSelect = document.querySelector('.grid-width-select');
    var selectedOption = gridSelect.querySelector('option[value="' + gridWidth + '"]');
    if (selectedOption) {
      selectedOption.setAttribute('selected', 'selected');
    }
    this.addEventListener(gridSelect, 'change', this.onGridWidthChange_);
  };

  ns.GridApplicationController.prototype.onGridWidthChange_ = function (evt) {
    var width = parseInt(evt.target.value, 10);
    pskl.UserSettings.set(pskl.UserSettings.GRID_WIDTH, width);
  };
})();
