(function () {
  var ns = $.namespace('pskl.controller.dialogs.importwizard.steps');

  ns.SelectMode = function (piskelController, importController, container) {
    this.superclass.constructor.apply(this, arguments);
  };

  ns.SelectMode.MODES = {
    REPLACE : 'replace',
    MERGE : 'merge'
  };

  pskl.utils.inherit(ns.SelectMode, ns.AbstractImportStep);

  ns.SelectMode.prototype.init = function () {
    this.superclass.init.call(this);

    var replaceButton = this.container.querySelector('.import-mode-replace-button');
    var mergeButton = this.container.querySelector('.import-mode-merge-button');

    this.addEventListener(replaceButton, 'click', this.onReplaceButtonClick_);
    this.addEventListener(mergeButton, 'click', this.onMergeButtonClick_);
  };

  ns.SelectMode.prototype.onShow = function () {
    this.superclass.onShow.call(this);
  };

  ns.SelectMode.prototype.destroy = function () {
    this.superclass.destroy.call(this);
  };

  ns.SelectMode.prototype.onReplaceButtonClick_ = function () {
    this.mergeData.importMode = ns.SelectMode.MODES.REPLACE;
    this.onNextClick();
  };

  ns.SelectMode.prototype.onMergeButtonClick_ = function () {
    this.mergeData.importMode = ns.SelectMode.MODES.MERGE;
    this.onNextClick();
  };
})();
