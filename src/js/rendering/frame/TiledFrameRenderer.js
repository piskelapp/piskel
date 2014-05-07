(function () {
  var ns = $.namespace('pskl.rendering.frame');

  ns.TiledFrameRenderer = function (container) {
    this.displayContainer = document.createElement('div');
    container.get(0).appendChild(this.displayContainer);
    this.displayContainer.style.backgroundRepeat = 'repeat';
    this.displayContainer.classList.add('tiled-frame-renderer');
    this.container = container;
    this.updateBackgroundClass_(pskl.UserSettings.get(pskl.UserSettings.CANVAS_BACKGROUND));
    $.subscribe(Events.USER_SETTINGS_CHANGED, $.proxy(this.onUserSettingsChange_, this));
  };

  ns.TiledFrameRenderer.prototype.render = function (frame) {
    var canvas = new pskl.utils.FrameUtils.toImage(frame);
    this.displayContainer.style.backgroundImage = 'url(' + canvas.toDataURL('image/png') + ')';
  };



  ns.TiledFrameRenderer.prototype.hide = function () {
    if (this.displayContainer) {
      this.displayContainer.style.display = 'none';
    }
  };

  ns.TiledFrameRenderer.prototype.show = function () {
    if (this.displayContainer) {
      this.displayContainer.style.display = 'block';
    }
  };
  
  ns.TiledFrameRenderer.prototype.setZoom = Constants.EMPTY_FUNCTION;

  ns.TiledFrameRenderer.prototype.setOffset = Constants.EMPTY_FUNCTION;

  ns.TiledFrameRenderer.prototype.setDisplaySize = Constants.EMPTY_FUNCTION;

  ns.TiledFrameRenderer.prototype.onUserSettingsChange_ = function (evt, settingName, settingValue) {
    if (settingName == pskl.UserSettings.CANVAS_BACKGROUND) {
      this.updateBackgroundClass_(settingValue);
    } else if (settingName == pskl.UserSettings.GRID_WIDTH) {
      this.setGridWidth(settingValue);
    }
  };

  ns.TiledFrameRenderer.prototype.updateBackgroundClass_ = function (newClass) {
    var currentClass = this.container.data('current-background-class');
    if (currentClass) {
      this.container.removeClass(currentClass);
    }
    this.container.addClass(newClass);
    this.container.data('current-background-class', newClass);
  };
})();