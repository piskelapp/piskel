(function () {
  var ns = $.namespace('pskl.controller');

  ns.CanvasBackgroundController = function () {
    this.body = document.body;
  };

  ns.CanvasBackgroundController.prototype.init = function () {
    $.subscribe(Events.USER_SETTINGS_CHANGED, this.onUserSettingsChange_.bind(this));
    this.updateBackgroundClass_(pskl.UserSettings.get(pskl.UserSettings.CANVAS_BACKGROUND));
  };

  ns.CanvasBackgroundController.prototype.onUserSettingsChange_ = function (evt, settingName, settingValue) {
    if (settingName == pskl.UserSettings.CANVAS_BACKGROUND) {
      this.updateBackgroundClass_(settingValue);
    }
  };

  ns.CanvasBackgroundController.prototype.updateBackgroundClass_ = function (newClass) {
    var currentClass = this.body.dataset.currentBackgroundClass;
    if (currentClass) {
      this.body.classList.remove(currentClass);
    }
    this.body.classList.add(newClass);
    this.body.dataset.currentBackgroundClass = newClass;
  };
})();
