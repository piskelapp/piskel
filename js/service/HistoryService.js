(function () {
  var ns = $.namespace("pskl.service");
  ns.HistoryService = function (piskelController) {
    this.piskelController = piskelController;
    this.saveState__b = this.saveState.bind(this);
  };

  ns.HistoryService.prototype.init = function () {

    $.subscribe(Events.PISKEL_RESET, this.saveState__b);
    $.subscribe(Events.TOOL_RELEASED, this.saveState__b);

    pskl.app.shortcutService.addShortcut('ctrl+Z', this.undo.bind(this));
    pskl.app.shortcutService.addShortcut('ctrl+Y', this.redo.bind(this));
  };

  ns.HistoryService.prototype.saveState = function () {
    this.piskelController.getCurrentFrame().saveState();
  };

  ns.HistoryService.prototype.undo = function () {
    this.piskelController.getCurrentFrame().loadPreviousState();
    $.unsubscribe(Events.PISKEL_RESET, this.saveState__b);
    $.publish(Events.PISKEL_RESET);
    $.subscribe(Events.PISKEL_RESET, this.saveState__b);
  };

  ns.HistoryService.prototype.redo = function () {
    this.piskelController.getCurrentFrame().loadNextState();
    $.unsubscribe(Events.PISKEL_RESET, this.saveState__b);
    $.publish(Events.PISKEL_RESET);
    $.subscribe(Events.PISKEL_RESET, this.saveState__b);
  };

})();