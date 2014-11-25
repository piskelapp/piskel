(function () {
  var ns = $.namespace("pskl.selection");

  var SELECTION_REPLAY = {
    PASTE : 'REPLAY_PASTE',
    ERASE : 'REPLAY_ERASE'
  };

  ns.SelectionManager = function (piskelController) {

    this.piskelController = piskelController;

    this.currentSelection = null;
  };

  ns.SelectionManager.prototype.init = function () {
    $.subscribe(Events.SELECTION_CREATED, $.proxy(this.onSelectionCreated_, this));
    $.subscribe(Events.SELECTION_DISMISSED, $.proxy(this.onSelectionDismissed_, this));
    $.subscribe(Events.SELECTION_MOVE_REQUEST, $.proxy(this.onSelectionMoved_, this));

    pskl.app.shortcutService.addShortcut('ctrl+V', this.paste.bind(this));
    pskl.app.shortcutService.addShortcut('ctrl+X', this.cut.bind(this));
    pskl.app.shortcutService.addShortcut('ctrl+C', this.copy.bind(this));
    pskl.app.shortcutService.addShortcut('del', this.erase.bind(this));
    pskl.app.shortcutService.addShortcut('back', this.onBackPressed_.bind(this));

    $.subscribe(Events.TOOL_SELECTED, $.proxy(this.onToolSelected_, this));
  };

  /**
   * @private
   */
  ns.SelectionManager.prototype.cleanSelection_ = function() {
    if(this.currentSelection) {
      this.currentSelection.reset();
      this.currentSelection = null;
    }
  };

  /**
   * @private
   */
  ns.SelectionManager.prototype.onToolSelected_ = function(evt, tool) {
    var isSelectionTool = tool instanceof pskl.tools.drawing.BaseSelect;
    if(!isSelectionTool) {
      this.cleanSelection_();
    }
  };

  /**
   * @private
   */
  ns.SelectionManager.prototype.onSelectionDismissed_ = function(evt) {
    this.cleanSelection_();
  };

  ns.SelectionManager.prototype.onBackPressed_ = function(evt) {
    if (this.currentSelection) {
      this.erase();
    } else {
      return true; // bubble
    }
  };

  ns.SelectionManager.prototype.erase = function () {
    var pixels = this.currentSelection.pixels;
    var currentFrame = this.piskelController.getCurrentFrame();
    for(var i=0, l=pixels.length; i<l; i++) {
      currentFrame.setPixel(pixels[i].col, pixels[i].row, Constants.TRANSPARENT_COLOR);
    }

    $.publish(Events.PISKEL_SAVE_STATE, {
      type : pskl.service.HistoryService.REPLAY,
      scope : this,
      replay : {
        type : SELECTION_REPLAY.ERASE,
        pixels : JSON.parse(JSON.stringify(pixels.slice(0)))
      }
    });
  };

  ns.SelectionManager.prototype.cut = function() {
    if(this.currentSelection) {
      // Put cut target into the selection:
      this.currentSelection.fillSelectionFromFrame(this.piskelController.getCurrentFrame());
      this.erase();
    }
    else {
      throw "Bad state for CUT callback in SelectionManager";
    }
  };

  ns.SelectionManager.prototype.paste = function() {
    if(this.currentSelection && this.currentSelection.hasPastedContent) {
      var pixels = this.currentSelection.pixels;
      var opaquePixels = pixels.filter(function (p) {
        return p.color !== Constants.TRANSPARENT_COLOR;
      });
      this.pastePixels(opaquePixels);
    }
  };

  ns.SelectionManager.prototype.pastePixels = function(pixels) {
    var currentFrame = this.piskelController.getCurrentFrame();

    pixels.forEach(function (pixel) {
      currentFrame.setPixel(pixel.col,pixel.row,pixel.color);
    });

    $.publish(Events.PISKEL_SAVE_STATE, {
      type : pskl.service.HistoryService.REPLAY,
      scope : this,
      replay : {
        type : SELECTION_REPLAY.PASTE,
        pixels : JSON.parse(JSON.stringify(pixels.slice(0)))
      }
    });
  };

  ns.SelectionManager.prototype.replay = function (frame, replayData) {
    var pixels = replayData.pixels;
    pixels.forEach(function (pixel) {
      var color = replayData.type === SELECTION_REPLAY.PASTE ? pixel.color : Constants.TRANSPARENT_COLOR;
      frame.setPixel(pixel.col, pixel.row, color);
    });
  };

  ns.SelectionManager.prototype.copy = function() {
    if(this.currentSelection && this.piskelController.getCurrentFrame()) {
      this.currentSelection.fillSelectionFromFrame(this.piskelController.getCurrentFrame());
    } else {
      throw "Bad state for CUT callback in SelectionManager";
    }
  };

  /**
   * @private
   */
  ns.SelectionManager.prototype.onSelectionCreated_ = function(evt, selection) {
    if(selection) {
      this.currentSelection = selection;
    } else {
      throw "No selection set in SelectionManager";
    }
  };

  /**
   * @private
   */
  ns.SelectionManager.prototype.onSelectionMoved_ = function(evt, colDiff, rowDiff) {
    if(this.currentSelection) {
      this.currentSelection.move(colDiff, rowDiff);
    }
    else {
      throw "Bad state: No currentSelection set when trying to move it in SelectionManager";
    }
  };
})();
