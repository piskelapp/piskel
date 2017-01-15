(function () {
  var ns = $.namespace('pskl.controller.dialogs.importwizard.steps');

  ns.InsertLocation = function () {
    this.superclass.constructor.apply(this, arguments);
  };

  ns.InsertLocation.MODES = {
    ADD : 'add',
    INSERT : 'insert'
  };

  pskl.utils.inherit(ns.InsertLocation, ns.AbstractImportStep);

  ns.InsertLocation.prototype.init = function () {
    this.superclass.init.call(this);
    this.framePreview = this.container.querySelector('.insert-frame-preview');
    this.framePickerWidget = new pskl.widgets.FramePicker(
      this.piskelController.getPiskel(), this.framePreview);
    this.framePickerWidget.init();

    var currentFrameIndex = this.piskelController.getCurrentFrameIndex();
    this.framePickerWidget.setFrameIndex(currentFrameIndex + 1);
    this.framePickerWidget.setFirstFrameIndex(0);

    this.insertModeContainer = this.container.querySelector('.insert-mode-container');
    this.addEventListener(this.insertModeContainer, 'change', this.onInsertModeChange_);
    this.mergeData.insertMode = ns.InsertLocation.MODES.ADD;
  };

  ns.InsertLocation.prototype.onInsertModeChange_  = function () {
    var value = this.insertModeContainer.querySelector(':checked').value;
    this.mergeData.insertMode = value;

    if (this.mergeData.insertMode === ns.InsertLocation.MODES.ADD) {
      this.framePickerWidget.setFirstFrameIndex(0);
    } else {
      this.framePickerWidget.setFirstFrameIndex(1);
    }
  };

  ns.InsertLocation.prototype.onShow = function () {
    var count = this.mergeData.mergePiskel.getFrameCount();
    this.container.querySelector('.insert-frames-count').innerText = count;
  };

  ns.InsertLocation.prototype.onNextClick = function () {
    var insertIndex = this.framePickerWidget.getFrameIndex();
    this.mergeData.insertIndex = insertIndex;
    this.superclass.onNextClick.call(this);
  };

  ns.InsertLocation.prototype.destroy = function () {
    this.framePickerWidget.destroy();
    this.superclass.destroy.call(this);
  };
})();
