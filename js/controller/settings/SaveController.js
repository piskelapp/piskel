(function () {
  var ns = $.namespace("pskl.controller.settings");

  ns.SaveController = function (piskelController) {
    this.piskelController = piskelController;
  };

  /**
   * @public
   */
  ns.SaveController.prototype.init = function () {
    this.titleInput = document.getElementById("save-title");
    this.descriptionInput = document.getElementById("save-description");

    this.titleInput.value = this.piskelController.piskel.getDescriptor().name;
    this.descriptionInput.value = this.piskelController.piskel.getDescriptor().description;
  };
})();