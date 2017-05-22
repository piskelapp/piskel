(function () {
  var ns = $.namespace('pskl.service');

  ns.SavedStatusService = function (piskelController, historyService) {
    this.piskelController = piskelController;
    this.historyService = historyService;
    this.lastSavedStateIndex = '';

    this.publishStatusUpdateEvent_ = this.publishStatusUpdateEvent_.bind(this);
  };

  ns.SavedStatusService.prototype.init = function () {
    $.subscribe(Events.TOOL_RELEASED, this.publishStatusUpdateEvent_);
    $.subscribe(Events.PISKEL_RESET, this.publishStatusUpdateEvent_);
    $.subscribe(Events.PISKEL_SAVED, this.onPiskelSaved.bind(this));
    this.lastSavedStateIndex = this.historyService.getCurrentStateId();
  };

  ns.SavedStatusService.prototype.onPiskelSaved = function () {
    this.lastSavedStateIndex = this.historyService.getCurrentStateId();
    this.publishStatusUpdateEvent_();
  };

  ns.SavedStatusService.prototype.publishStatusUpdateEvent_ = function () {
    $.publish(Events.PISKEL_SAVED_STATUS_UPDATE);
  };

  ns.SavedStatusService.prototype.isDirty = function () {
    return (this.lastSavedStateIndex != this.historyService.getCurrentStateId());
  };
})();
