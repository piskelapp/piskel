(function () {
  var ns = $.namespace('pskl.controller.dialogs.importwizard.steps');

  ns.SelectMode = function (piskelController, importController, container) {
    this.superclass.constructor.apply(this, arguments);
  };

  ns.SelectMode.MODES = {
    NEW : 'new',
    REPLACE : 'replace',
    MERGE : 'merge'
  };

  pskl.utils.inherit(ns.SelectMode, ns.AbstractImportStep);

  ns.SelectMode.prototype.init = function () {
    this.superclass.init.call(this);

    this.importMode = this.container.querySelector('.import-mode');
    this.addEventListener(this.importMode, 'change', this.onImportModeChange_);

    // Set the initial importMode value in the merge data.
    this.mergeData.importMode = this.getSelectedMode_();
  };

  ns.SelectMode.prototype.onShow = function () {
    this.refresh_();
  };

  ns.SelectMode.prototype.destroy = function () {
    if (this.framePickerWidget) {
      this.framePickerWidget.destroy();
    }
    this.superclass.destroy.call(this);
  };

  ns.SelectMode.prototype.refresh_ = function () {
    var mergePiskel = this.mergeData.mergePiskel;
    if (mergePiskel) {
      this.updateMergeFilePreview_();
      this.nextButton.removeAttribute('disabled');
    } else {
      this.nextButton.setAttribute('disabled', true);
    }

    if (this.mergeData.importMode === ns.SelectMode.MODES.MERGE) {
      // If the user wants to merge with the existing content, there are more steps ahead.
      this.nextButton.textContent = 'next';
    } else {
      // Otherwise this is the last step, update the button text.
      this.nextButton.textContent = 'import';
    }
  };

  ns.SelectMode.prototype.updateMergeFilePreview_ = function () {
    var mergePiskel = this.mergeData.mergePiskel;

    var previewFrame = pskl.utils.LayerUtils.mergeFrameAt(mergePiskel.getLayers(), 0);
    var image = pskl.utils.FrameUtils.toImage(previewFrame);

    if (!this.framePickerWidget) {
      var framePickerContainer = this.container.querySelector('.import-preview');
      this.framePickerWidget = new pskl.widgets.FramePicker(mergePiskel, framePickerContainer);
      this.framePickerWidget.init();
    } else if (this.framePickerWidget.piskel != mergePiskel) {
      // If the piskel displayed by the frame picker is different from the previous one,
      // refresh the widget.
      this.framePickerWidget.piskel = mergePiskel;
      this.framePickerWidget.setFrameIndex(1);
    }

    var metaHtml = pskl.utils.Template.getAndReplace('import-meta-content', {
      name : mergePiskel.getDescriptor().name,
      dimensions : pskl.utils.StringUtils.formatSize(mergePiskel.getWidth(), mergePiskel.getHeight()),
      frames : mergePiskel.getFrameCount(),
      layers : mergePiskel.getLayers().length
    });
    this.container.querySelector('.import-meta').innerHTML = metaHtml;
  };

  ns.SelectMode.prototype.onImportModeChange_ = function () {
    this.mergeData.importMode = this.getSelectedMode_();
    this.refresh_();
  };

  ns.SelectMode.prototype.getSelectedMode_ = function () {
    return this.importMode.querySelector(':checked').value;
  };
})();
