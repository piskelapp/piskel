(function () {
  var ns = $.namespace("pskl.service");
  ns.HistoryService = function (piskelController) {
    this.piskelController = piskelController;
  };

  ns.HistoryService.prototype.init = function () {

    $.subscribe(Events.TOOL_RELEASED, this.saveState.bind(this));

    pskl.app.shortcutService.addShortcut('ctrl+Z', this.undo.bind(this));
    pskl.app.shortcutService.addShortcut('ctrl+Y', this.redo.bind(this));
  };

  ns.HistoryService.prototype.saveState = function () {
    this.piskelController.getCurrentFrame().saveState();
  };

  ns.HistoryService.prototype.undo = function () {
    this.piskelController.getCurrentFrame().loadPreviousState();
    $.publish(Events.PISKEL_RESET);
  };

  ns.HistoryService.prototype.redo = function () {
    this.piskelController.getCurrentFrame().loadNextState();
    $.publish(Events.PISKEL_RESET);
  };

})();