/**
 * @provide pskl.tools.drawing.selection.LassoSelect
 *
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace('pskl.tools.drawing.selection');

  ns.LassoSelect = function() {
    ns.AbstractDragSelect.call(this);

    this.toolId = 'tool-lasso-select';
    this.helpText = 'Lasso selection';
    this.shortcut = pskl.service.keyboard.Shortcuts.TOOL.LASSO_SELECT;
  };

  pskl.utils.inherit(ns.LassoSelect, ns.AbstractDragSelect);

  /** @override */
  ns.LassoSelect.prototype.onDragSelectStart_ = function (col, row) {
    this.pixels = [{col : col, row : row}];

    this.startCol = col;
    this.startRow = row;

    this.previousCol = col;
    this.previousRow = row;

    $.publish(Events.DRAG_START, [col, row]);
  };

  /** @override */
  ns.LassoSelect.prototype.onDragSelect_ = function (col, row, frame, overlay) {
    this.addPixel_(col, row, frame);
    // use ShapeSelection during selection, contains only the pixels hovered by the user
    var selection = new pskl.selection.ShapeSelection(this.getLassoPixels_());
    this.setSelection_(selection, overlay);
  };

  /** @override */
  ns.LassoSelect.prototype.onDragSelectEnd_ = function (col, row, frame, overlay) {
    this.addPixel_(col, row, frame);
    // use LassoSelection to finalize selection, includes pixels inside the lasso shape
    var selection = new pskl.selection.LassoSelection(this.getLassoPixels_(), frame);
    this.setSelection_(selection, overlay);

    $.publish(Events.DRAG_END);
  };

  /**
   * Retrieve the lasso shape as an array of pixels. A line is added between the origin of the selection
   * and the last known coordinate to make sure the shape is closed.
   *
   * @return {Array} array of pixels corresponding to the whole lasso shape
   * @private
   */
  ns.LassoSelect.prototype.getLassoPixels_ = function () {
    var line = pskl.PixelUtils.getLinePixels(this.previousCol, this.startCol, this.previousRow, this.startRow);
    return this.pixels.concat(line);
  };

  /**
   * Add the provided pixel to the lasso pixels Array.
   * @private
   */
  ns.LassoSelect.prototype.addPixel_ = function (col, row, frame) {
    // normalize coordinates to always remain inside the frame
    col = pskl.utils.Math.minmax(col, 0, frame.getWidth() - 1);
    row = pskl.utils.Math.minmax(row, 0, frame.getHeight() - 1);

    // line interpolation needed in case mousemove was too fast
    var interpolatedPixels = pskl.PixelUtils.getLinePixels(col, this.previousCol, row, this.previousRow);
    this.pixels = this.pixels.concat(interpolatedPixels);

    // update state
    this.previousCol = col;
    this.previousRow = row;
  };

  /** @private */
  ns.LassoSelect.prototype.setSelection_ = function (selection, overlay) {
    this.selection = selection;

    $.publish(Events.SELECTION_CREATED, [this.selection]);
    overlay.clear();
    this.drawSelectionOnOverlay_(overlay);
  };
})();
