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

    this.addEventListener(this.nextButton, 'click', this.onNextClick);
    this.addEventListener(this.backButton, 'click', this.onBackClick);
  };

  ns.AbstractImportStep.prototype.addEventListener = function (el, type, cb) {
    pskl.utils.Event.addEventListener(el, type, cb, this);
  };

  ns.AbstractImportStep.prototype.destroy = function () {
    if (this.framePickerWidget) {
      this.framePickerWidget.destroy();
    }

    pskl.utils.Event.removeAllEventListeners(this);
  };

  ns.AbstractImportStep.prototype.onNextClick = function () {
    this.importController.next(this);
  };

  ns.AbstractImportStep.prototype.onBackClick = function () {
    this.importController.back(this);
  };

  ns.AbstractImportStep.prototype.onShow = function () {
    var mergePiskel = this.mergeData.mergePiskel;
    if (!mergePiskel) {
      return;
    }

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

})();
