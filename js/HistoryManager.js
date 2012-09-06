(function () {
	var ns = $.namespace("pskl");
	ns.HistoryManager = function () {};

	ns.HistoryManager.prototype.init = function () {
        document.body.addEventListener('keyup', this.onKeyup.bind(this));
        $.subscribe(Events.TOOL_RELEASED, this.saveState.bind(this));
	};

    ns.HistoryManager.prototype.saveState = function () {
      piskel.getCurrentFrame().saveState();
    };

	ns.HistoryManager.prototype.onKeyup = function (evt) {
      if (evt.ctrlKey && evt.keyCode == 90) { // CTRL + Z
        this.undo();
      }

      if (evt.ctrlKey && evt.keyCode == 89) { // CTRL+ Y
        this.redo();
      }
    };

    ns.HistoryManager.prototype.undo = function () {
      piskel.getCurrentFrame().loadPreviousState();
      this.redraw();
    };

    ns.HistoryManager.prototype.redo = function () {
      piskel.getCurrentFrame().loadNextState();
      this.redraw();
    };

    ns.HistoryManager.prototype.redraw = function () {
      piskel.drawingController.renderFrame();
      piskel.previewsController.createPreviews();
    };

    ns.HistoryManager = new ns.HistoryManager();
})();