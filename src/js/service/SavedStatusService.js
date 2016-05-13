(function () {
  var ns = $.namespace('pskl.service');

  ns.SavedStatusService = function (piskelController, historyService) {
    this.piskelController = piskelController;
    this.historyService = historyService;
    this.lastSavedStateIndex = '';
  };

  ns.SavedStatusService.prototype.init = function () {
    $.subscribe(Events.TOOL_RELEASED, this.onToolReleased.bind(this));
    $.subscribe(Events.PISKEL_RESET, this.onPiskelReset.bind(this));
    $.subscribe(Events.PISKEL_SAVED, this.onPiskelSaved.bind(this));
    this.lastSavedStateIndex = this.historyService.getCurrentStateIndex();
  };

  ns.SavedStatusService.prototype.onToolReleased = function () {
    this.updateDirtyStatus();
  };

  ns.SavedStatusService.prototype.onPiskelReset = function () {
    this.updateDirtyStatus();
  };

  ns.SavedStatusService.prototype.onPiskelSaved = function () {
    this.lastSavedStateIndex = this.historyService.getCurrentStateIndex();
    $.publish(Events.PISKEL_SAVED_STATUS_UPDATE);
  };

  ns.SavedStatusService.prototype.updateDirtyStatus = function () {
    $.publish(Events.PISKEL_SAVED_STATUS_UPDATE);
  };

  ns.SavedStatusService.prototype.isDirty = function () {
    return (this.lastSavedStateIndex != this.historyService.getCurrentStateIndex());
  };
})();
