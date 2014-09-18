(function () {
  var ns = $.namespace('pskl.controller.widgets');

  ns.ColorsListController = function (container) {
    this.container = container;
    this.colorsList = this.container.querySelector('.colors-list');
  };
})();