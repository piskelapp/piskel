(function () {
  var ns = $.namespace('pskl.service');

  var BUTTON_UNSET = null;

  ns.MouseStateService = function () {
    this.lastButtonPressed_ = BUTTON_UNSET;
  };

  ns.MouseStateService.prototype.init = function () {
    $.subscribe(Events.MOUSE_EVENT, this.onMouseEvent_.bind(this));
  };

  ns.MouseStateService.prototype.isLeftButtonPressed = function () {
    return this.isMouseButtonPressed_(Constants.LEFT_BUTTON);
  };

  ns.MouseStateService.prototype.isRightButtonPressed = function () {
    return this.isMouseButtonPressed_(Constants.RIGHT_BUTTON);
  };

  ns.MouseStateService.prototype.isMiddleButtonPressed = function () {
    return this.isMouseButtonPressed_(Constants.MIDDLE_BUTTON);
  };

  ns.MouseStateService.prototype.isMouseButtonPressed_ = function (mouseButton) {
    return this.lastButtonPressed_ != BUTTON_UNSET && this.lastButtonPressed_ == mouseButton;
  }

  ns.MouseStateService.prototype.onMouseEvent_ = function(evt, mouseEvent) {
    if (mouseEvent.type == 'mousedown') {
      this.lastButtonPressed_ = mouseEvent.button;
    } else if (mouseEvent.type == 'mouseup') {
      this.lastButtonPressed_ = BUTTON_UNSET;
    }
    // Warning : do not call setCurrentButton here
        // mousemove do not have the correct mouse button information on all browsers
  };
})();