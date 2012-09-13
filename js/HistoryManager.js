(function () {
	var ns = $.namespace("pskl");
	ns.HistoryManager = function (framesheet) {
    this.framesheet = framesheet; 
  };

	ns.HistoryManager.prototype.init = function () {
    $.subscribe(Events.TOOL_RELEASED, this.saveState.bind(this));

    $.subscribe(Events.UNDO, this.undo.bind(this));
    $.subscribe(Events.REDO, this.redo.bind(this));
	};

  ns.HistoryManager.prototype.saveState = function () {
    this.framesheet.getCurrentFrame().saveState();
  };

  ns.HistoryManager.prototype.undo = function () {
    this.framesheet.getCurrentFrame().loadPreviousState();
    this.redraw();
  };

  ns.HistoryManager.prototype.redo = function () {
    this.framesheet.getCurrentFrame().loadNextState();
    this.redraw();
  };

  ns.HistoryManager.prototype.redraw = function () {
    this.framesheet.drawingController.renderFrame();
    this.framesheet.previewsController.createPreviews();
  };
})();