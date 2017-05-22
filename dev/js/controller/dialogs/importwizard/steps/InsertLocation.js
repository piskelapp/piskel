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
    this.currentPiskelFramePickerWidget = new pskl.widgets.FramePicker(
      this.piskelController.getPiskel(), this.framePreview);

    this.insertModeContainer = this.container.querySelector('.insert-mode-container');
    this.addEventListener(this.insertModeContainer, 'change', this.onInsertModeChange_);
    this.mergeData.insertMode = ns.InsertLocation.MODES.ADD;
  };

  ns.InsertLocation.prototype.onInsertModeChange_  = function () {
    var value = this.insertModeContainer.querySelector(':checked').value;
    this.mergeData.insertMode = value;

    if (this.mergeData.insertMode === ns.InsertLocation.MODES.ADD) {
      this.currentPiskelFramePickerWidget.setFirstFrameIndex(0);
    } else {
      this.currentPiskelFramePickerWidget.setFirstFrameIndex(1);
    }
  };

  ns.InsertLocation.prototype.onShow = function () {
    // Initialize the frame picker on show, to be able to calculate correctly the
    // container's offsetWidth and offsetHeight.
    this.currentPiskelFramePickerWidget.init();

    var currentFrameIndex = this.piskelController.getCurrentFrameIndex();
    this.currentPiskelFramePickerWidget.setFrameIndex(currentFrameIndex + 1);
    this.currentPiskelFramePickerWidget.setFirstFrameIndex(0);

    this.superclass.onShow.call(this);
  };

  ns.InsertLocation.prototype.onNextClick = function () {
    var insertIndex = this.currentPiskelFramePickerWidget.getFrameIndex();
    this.mergeData.insertIndex = insertIndex;
    this.superclass.onNextClick.call(this);
  };

  ns.InsertLocation.prototype.destroy = function () {
    this.currentPiskelFramePickerWidget.destroy();
    this.superclass.destroy.call(this);
  };
})();
