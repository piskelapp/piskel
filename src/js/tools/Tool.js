(function () {
  var ns = $.namespace('pskl.tools');

  ns.Tool = function () {
    this.toolId = 'tool';
    this.helpText = 'Abstract tool';
    this.tooltipDescriptors = [];
    // Offset from left - top corner to position the cursor custom image with the pointer.
    this.cursorImageOffset = [0, 0]; // x from left, y from top
  };

  ns.Tool.prototype.getHelpText = function () {
    return this.helpText;
  };

  ns.Tool.prototype.getId = function () {
    return this.toolId;
  };

  ns.Tool.prototype.raiseSaveStateEvent = function (replayData) {
    $.publish(Events.PISKEL_SAVE_STATE, {
      type: pskl.service.HistoryService.REPLAY,
      scope: this,
      replay: replayData
    });
  };
})();
