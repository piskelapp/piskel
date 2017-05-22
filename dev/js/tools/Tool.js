(function () {
  var ns = $.namespace('pskl.tools');

  ns.Tool = function () {
    this.toolId = 'tool';
    this.helpText = 'Abstract tool';
    this.tooltipDescriptors = [];
  };

  ns.Tool.prototype.getHelpText = function() {
    return this.helpText;
  };

  ns.Tool.prototype.getId = function() {
    return this.toolId;
  };

  ns.Tool.prototype.raiseSaveStateEvent = function (replayData) {
    $.publish(Events.PISKEL_SAVE_STATE, {
      type : pskl.service.HistoryService.REPLAY,
      scope : this,
      replay : replayData
    });
  };
})();
