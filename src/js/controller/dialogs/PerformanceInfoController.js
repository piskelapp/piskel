(function () {
  var ns = $.namespace('pskl.controller.dialogs');

  ns.PerformanceInfoController = function () {};

  pskl.utils.inherit(ns.PerformanceInfoController, ns.AbstractDialogController);

  ns.PerformanceInfoController.prototype.init = function () {
    this.superclass.init.call(this);
  };
})();
