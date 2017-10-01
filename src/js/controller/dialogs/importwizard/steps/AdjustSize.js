(function () {
  var ns = $.namespace('pskl.controller.dialogs.importwizard.steps');

  ns.AdjustSize = function (piskelController, importController, container) {
    this.superclass.constructor.apply(this, arguments);
  };

  ns.AdjustSize.OPTIONS = {
    KEEP: 'keep',
    EXPAND: 'expand'
  };

  pskl.utils.inherit(ns.AdjustSize, ns.AbstractImportStep);

  ns.AdjustSize.prototype.init = function () {
    this.superclass.init.call(this);

    // Create anchor widget
    var anchorContainer = this.container.querySelector('.import-resize-anchor-container');
    this.anchorWidget = new pskl.widgets.AnchorWidget(anchorContainer, this.onAnchorChange_.bind(this));
    this.anchorWidget.setOrigin('TOPLEFT');

    this.resizeInfoContainer = this.container.querySelector('.import-resize-info');
    this.addEventListener(this.resizeInfoContainer, 'change', this.onResizeOptionChange_);

    // By default, set the mode to expand to avoid losing any image content.
    this.mergeData.resize = ns.AdjustSize.OPTIONS.EXPAND;
  };

  ns.AdjustSize.prototype.destroy = function () {
    this.anchorWidget.destroy();
    this.superclass.destroy.call(this);
  };

  ns.AdjustSize.prototype.onShow = function () {
    this.refresh_();
    this.superclass.onShow.call(this);
  };

  ns.AdjustSize.prototype.refresh_ = function () {
    var isBigger = this.isImportedPiskelBigger_();
    var keep = this.mergeData.resize === ns.AdjustSize.OPTIONS.KEEP;

    // Refresh resize partial
    var size = this.formatPiskelSize_(this.piskelController.getPiskel());
    var newSize = this.formatPiskelSize_(this.mergeData.mergePiskel);
    var markup;
    if (isBigger) {
      markup = pskl.utils.Template.getAndReplace('import-resize-bigger-partial', {
        size : size,
        newSize : newSize,
        keepChecked : keep ? 'checked="checked"' : '',
        expandChecked : keep ? '' : 'checked="checked"'
      });
    } else {
      markup = pskl.utils.Template.getAndReplace('import-resize-smaller-partial', {
        size : size,
        newSize : newSize
      });
    }
    this.resizeInfoContainer.innerHTML = markup;

    // Update anchor widget
    if (this.mergeData.origin) {
      this.anchorWidget.setOrigin(this.mergeData.origin);
    }

    // Update anchor widget info
    var anchorInfo = this.container.querySelector('.import-resize-anchor-info');
    if (isBigger && keep) {
      anchorInfo.innerHTML = [
        '<div class="import-resize-warning">',
        '  Imported content will be cropped!',
        '</div>',
        'Select crop anchor:'
      ].join('');
    } else if (isBigger) {
      anchorInfo.innerHTML = 'Select resize anchor:';
    } else {
      anchorInfo.innerHTML = 'Select position anchor:';
    }
  };

  ns.AdjustSize.prototype.onAnchorChange_ = function (origin) {
    this.mergeData.origin = origin;
  };

  ns.AdjustSize.prototype.onResizeOptionChange_ = function () {
    var value = this.resizeInfoContainer.querySelector(':checked').value;
    if (this.mergeData.resize != value) {
      this.mergeData.resize = value;
      this.refresh_();
    }
  };

  ns.AdjustSize.prototype.isImportedPiskelBigger_ = function () {
    var piskel = this.mergeData.mergePiskel;
    if (!piskel) {
      return false;
    }

    return piskel.width > this.piskelController.getWidth() ||
           piskel.height > this.piskelController.getHeight();
  };

  ns.AdjustSize.prototype.formatPiskelSize_ = function (piskel) {
    return pskl.utils.StringUtils.formatSize(piskel.width, piskel.height);
  };
})();
