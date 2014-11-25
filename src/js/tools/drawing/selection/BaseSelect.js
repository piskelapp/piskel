/**
 * @provide pskl.tools.drawing.BaseSelect
 *
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace("pskl.tools.drawing");

  ns.BaseSelect = function() {
    this.secondaryToolId = pskl.tools.drawing.Move.TOOL_ID;
    this.BodyRoot = $('body');

    // Select's first point coordinates (set in applyToolAt)
    this.startCol = null;
    this.startRow = null;

    this.selection = null;

    this.tooltipDescriptors = [
      {description : "Drag the selection to move it. You may switch to other layers and frames."},
      {key : 'ctrl+c', description : 'Copy the selected area'},
      {key : 'ctrl+v', description : 'Paste the copied area'}
    ];
  };

  pskl.utils.inherit(ns.BaseSelect, ns.BaseTool);

  /**
   * @override
   */
  ns.BaseSelect.prototype.applyToolAt = function(col, row, color, frame, overlay, event) {
    this.startCol = col;
    this.startRow = row;

    this.lastCol = col;
    this.lastRow = row;

    // The select tool can be in two different state.
    // If the inital click of the tool is not on a selection, we go in "select"
    // mode to create a selection.
    // If the initial click is on a previous selection, we go in "moveSelection"
    // mode to allow to move the selection by drag'n dropping it.
    if(this.isInSelection(col, row)) {
      this.mode = "moveSelection";
      this.onSelectionDragStart_(col, row, color, frame, overlay);
    }
    else {
      this.mode = "select";
      this.onSelectStart_(col, row, color, frame, overlay);
    }
  };

  /**
   * @override
   */
  ns.BaseSelect.prototype.moveToolAt = function(col, row, color, frame, overlay, event) {
    if(this.mode == "select") {
      this.onSelect_(col, row, color, frame, overlay);
    } else if(this.mode == "moveSelection") {
      this.onSelectionDrag_(col, row, color, frame, overlay);
    }
  };

  /**
   * @override
   */
  ns.BaseSelect.prototype.releaseToolAt = function(col, row, color, frame, overlay, event) {
    if(this.mode == "select") {
      this.onSelectEnd_(col, row, color, frame, overlay);
    } else if(this.mode == "moveSelection") {

      this.onSelectionDragEnd_(col, row, color, frame, overlay);
    }
  };

  /**
   * If we mouseover the selection draw inside the overlay frame, show the 'move' cursor
   * instead of the 'select' one. It indicates that we can move the selection by dragndroping it.
   * @override
   */
  ns.BaseSelect.prototype.moveUnactiveToolAt = function(col, row, color, frame, overlay, event) {
    if (overlay.containsPixel(col, row)) {
      if(this.isInSelection(col, row)) {
        // We're hovering the selection, show the move tool:
        this.BodyRoot.addClass(this.secondaryToolId);
        this.BodyRoot.removeClass(this.toolId);
      } else {
        // We're not hovering the selection, show create selection tool:
        this.BodyRoot.addClass(this.toolId);
        this.BodyRoot.removeClass(this.secondaryToolId);
      }
    }
  };

  ns.BaseSelect.prototype.isInSelection = function (col, row) {
    return this.selection && this.selection.pixels.some(function (pixel) {
      return pixel.col === col && pixel.row === row;
    });
  };

  ns.BaseSelect.prototype.hideHighlightedPixel = function() {
    // there is no highlighted pixel for selection tools, do nothing
  };

  /**
   * For each pixel in the selection draw it in white transparent on the tool overlay
   * @protected
   */
  ns.BaseSelect.prototype.drawSelectionOnOverlay_ = function (overlay) {
    var pixels = this.selection.pixels;
    for(var i=0, l=pixels.length; i<l; i++) {
      var pixel = pixels[i];
      var hasColor = pixel.color && pixel.color !== Constants.TRANSPARENT_COLOR ;
      var color = hasColor ? this.getTransparentVariant(pixel.color) : Constants.SELECTION_TRANSPARENT_COLOR;

      overlay.setPixel(pixels[i].col, pixels[i].row, color);
    }
  };

  ns.BaseSelect.prototype.getTransparentVariant = function (colorStr) {
    var color = window.tinycolor(colorStr);
    color = window.tinycolor.lighten(color, 10);
    color.setAlpha(0.5);
    return color.toRgbString();
  };

  // The list of callbacks to implement by specialized tools to implement the selection creation behavior.
  /** @protected */
  ns.BaseSelect.prototype.onSelectStart_ = function (col, row, color, frame, overlay) {};
  /** @protected */
  ns.BaseSelect.prototype.onSelect_ = function (col, row, color, frame, overlay) {};
  /** @protected */
  ns.BaseSelect.prototype.onSelectEnd_ = function (col, row, color, frame, overlay) {};


  // The list of callbacks that define the drag'n drop behavior of the selection.
  /** @private */
  ns.BaseSelect.prototype.onSelectionDragStart_ = function (col, row, color, frame, overlay) {
  };

  /** @private */
  ns.BaseSelect.prototype.onSelectionDrag_ = function (col, row, color, frame, overlay) {
    var deltaCol = col - this.lastCol;
    var deltaRow = row - this.lastRow;

    var colDiff = col - this.startCol, rowDiff = row - this.startRow;

    this.selection.move(deltaCol, deltaRow);

    overlay.clear();
    this.drawSelectionOnOverlay_(overlay);

    this.lastCol = col;
    this.lastRow = row;
  };

  /** @private */
  ns.BaseSelect.prototype.onSelectionDragEnd_ = function (col, row, color, frame, overlay) {
    this.onSelectionDrag_(col, row, color, frame, overlay);
  };
})();
