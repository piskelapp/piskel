(function () {
  var ns = $.namespace('pskl.controller.dialogs.importwizard.steps');

  ns.AbstractImportStep = function (piskelController, importController, container) {
    this.piskelController = piskelController;
    this.container = container;
    this.importController = importController;
    this.mergeData = this.importController.mergeData;
  };

  ns.AbstractImportStep.prototype.init = function () {
    this.nextButton = this.container.querySelector('.import-next-button');
    this.backButton = this.container.querySelector('.import-back-button');
    this.cancelButton = this.container.querySelector('.import-cancel-button');

    this.addEventListener(this.nextButton, 'click', this.onNextClick);
    this.addEventListener(this.cancelButton, 'click', this.onCancelClick);
    this.addEventListener(this.backButton, 'click', this.onBackClick);
  };

  ns.AbstractImportStep.prototype.addEventListener = function (el, type, cb) {
    pskl.utils.Event.addEventListener(el, type, cb, this);
  };

  ns.AbstractImportStep.prototype.destroy = function () {
    pskl.utils.Event.removeAllEventListeners(this);
  };

  ns.AbstractImportStep.prototype.onCancelClick = function () {
    this.importController.closeDialog();
  };

  ns.AbstractImportStep.prototype.onNextClick = function () {
    this.importController.next(this);
  };

  ns.AbstractImportStep.prototype.onBackClick = function () {
    this.importController.back(this);
  };

  ns.AbstractImportStep.prototype.onShow = Constants.EMPTY_FUNCTION;

})();
