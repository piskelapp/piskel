(function () {
  var ns = $.namespace('pskl.controller.settings');

  ns.NewPiskelController = function (piskelController) {
    this.piskelController = piskelController;
  };

  ns.NewPiskelController.prototype.init = function () {};

  ns.NewPiskelController.prototype.run = function() {
    if (window.confirm('This will open a new Piskel editor, are you sure?')) {
      pskl.app.openNewPiskel();
    }
  };
})();
