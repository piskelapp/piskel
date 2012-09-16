(function () {
	var ns = $.namespace("pskl.service");
	ns.HistoryService = function (framesheet) {
    this.framesheet = framesheet; 
  };

	ns.HistoryService.prototype.init = function () {
    
    $.subscribe(Events.TOOL_RELEASED, this.saveState.bind(this));
    $.subscribe(Events.UNDO, this.undo.bind(this));
    $.subscribe(Events.REDO, this.redo.bind(this));
	};

  ns.HistoryService.prototype.saveState = function () {
    this.framesheet.getCurrentFrame().saveState();
  };

  ns.HistoryService.prototype.undo = function () {
    this.framesheet.getCurrentFrame().loadPreviousState();
    $.publish(Events.FRAMESHEET_RESET);
  };

  ns.HistoryService.prototype.redo = function () {
    this.framesheet.getCurrentFrame().loadNextState();
    $.publish(Events.FRAMESHEET_RESET);
  };

})();