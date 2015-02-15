(function () {
  var ns = $.namespace('pskl.controller.settings');

  var ORIGIN = {
    TOPLEFT : 'TOPLEFT',
    TOP : 'TOP',
    TOPRIGHT : 'TOPRIGHT',
    MIDDLELEFT : 'MIDDLELEFT',
    MIDDLE : 'MIDDLE',
    MIDDLERIGHT : 'MIDDLERIGHT',
    BOTTOMLEFT : 'BOTTOMLEFT',
    BOTTOM : 'BOTTOM',
    BOTTOMRIGHT : 'BOTTOMRIGHT',
  };

  ns.ResizeController = function (piskelController) {
    this.piskelController = piskelController;
    this.origin = ORIGIN.TOPLEFT;
  };

  ns.ResizeController.prototype.init = function () {
    this.resizeWidth = $('[name=resize-width]');
    this.resizeHeight = $('[name=resize-height]');

    this.resizeWidth.val(this.piskelController.getWidth());
    this.resizeHeight.val(this.piskelController.getHeight());

    this.cancelButton = $('.resize-cancel-button');
    this.cancelButton.click(this.onCancelButtonClicked_.bind(this));

    this.resizeForm = $('[name=resize-form]');
    this.resizeForm.submit(this.onResizeFormSubmit_.bind(this));

    this.resizeOrigin = document.querySelector('.resize-origin-container');
    this.resizeOrigin.addEventListener('click', this.onResizeOriginClick_.bind(this));
    this.setOrigin_(ORIGIN.TOPLEFT);

    this.resizeContentCheckbox = $(".resize-content-checkbox");
  };

  ns.ResizeController.prototype.onResizeOriginClick_ = function (evt) {
    var target = evt.target;
    var origin = target.dataset.origin;
    if (origin && ORIGIN[origin]) {
      origin = origin.toUpperCase();
      this.setOrigin_(origin);
    }
  };

  ns.ResizeController.prototype.setOrigin_ = function (origin) {
    this.origin = origin;
    var previous = document.querySelector('.resize-origin-option.selected');
    if (previous) {
      previous.classList.remove('selected');
    }

    var selected = document.querySelector('.resize-origin-option[data-origin="' + origin + '"]');
    if (selected) {
      selected.classList.add('selected');
    }
  };

  ns.ResizeController.prototype.onResizeFormSubmit_ = function (evt) {
    evt.originalEvent.preventDefault();

    var width = parseInt(this.resizeWidth.val(), 10);
    var height = parseInt(this.resizeHeight.val(), 10);

    var resizeContentEnabled = this.isResizeContentEnabled_();
    var resizedLayers = this.piskelController.getLayers().map(this.resizeLayer_.bind(this));

    var piskel = pskl.model.Piskel.fromLayers(resizedLayers, this.piskelController.getPiskel().getDescriptor());

    pskl.app.piskelController.setPiskel(piskel, true);
    $.publish(Events.CLOSE_SETTINGS_DRAWER);
  };

  ns.ResizeController.prototype.resizeLayer_ = function (layer) {
    var resizedFrames = layer.getFrames().map(this.resizeFrame_.bind(this));
    return pskl.model.Layer.fromFrames(layer.getName(), resizedFrames);
  };

  ns.ResizeController.prototype.resizeFrame_ = function (frame) {
    var width = parseInt(this.resizeWidth.val(), 10);
    var height = parseInt(this.resizeHeight.val(), 10);

    var resizedFrame;
    if (this.isResizeContentEnabled_()) {
      resizedFrame = pskl.utils.FrameUtils.resize(frame, width, height, false);
    } else {
      resizedFrame = new pskl.model.Frame(width, height);
      frame.forEachPixel(function (color, x, y) {
        var translated = this.translateCoordinates_(x, y, frame, resizedFrame);
        if (resizedFrame.containsPixel(translated.x, translated.y)) {
          resizedFrame.setPixel(translated.x, translated.y, color);
        }
      }.bind(this));
    }

    return resizedFrame;
  };

  ns.ResizeController.prototype.translateCoordinates_ = function (x, y, frame, resizedFrame) {
    var translatedX, translatedY;
    if (this.origin.indexOf('LEFT') != -1) {
      translatedX = x;
    } else if (this.origin.indexOf('RIGHT') != -1) {
      translatedX = x - (frame.width - resizedFrame.width);
    } else {
      translatedX = x - Math.round((frame.width - resizedFrame.width)/2);
    }

    if (this.origin.indexOf('TOP') != -1) {
      translatedY = y;
    } else if (this.origin.indexOf('BOTTOM') != -1) {
      translatedY = y - (frame.height - resizedFrame.height);
    } else {
      translatedY = y - Math.round((frame.height - resizedFrame.height)/2);
    }

    return {
      x : translatedX,
      y : translatedY
    };

  };

  ns.ResizeController.prototype.isResizeContentEnabled_ = function () {
    return !!this.resizeContentCheckbox.prop('checked');
  };

  ns.ResizeController.prototype.onCancelButtonClicked_ = function (evt) {
    $.publish(Events.CLOSE_SETTINGS_DRAWER);
  };
})();