(function () {
  var ns = $.namespace('pskl.service');

  var BUTTON_UNSET = null;

  /**
   * This service exists mostly due to a FF/IE bug.
   * For mousemove events, the button type is set to 0 (e.g. left button type) whatever was the
   * pressed button on mousedown. We use this service to cache the button type value on mousedown
   * and make it available to mousemove events.
   */
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
  };

  ns.MouseStateService.prototype.onMouseEvent_ = function(evt, mouseEvent) {
    if (mouseEvent.type == 'mousedown') {
      this.lastButtonPressed_ = mouseEvent.button;
    } else if (mouseEvent.type == 'mouseup') {
      this.lastButtonPressed_ = BUTTON_UNSET;
    }
  };
})();
