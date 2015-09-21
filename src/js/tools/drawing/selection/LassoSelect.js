/**
 * @provide pskl.tools.drawing.ShapeSelect
 *
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace('pskl.tools.drawing.selection');

  ns.LassoSelect = function() {
    this.toolId = 'tool-lasso-select';
    this.helpText = 'Lasso selection';

    ns.AbstractDragSelect.call(this);
  };

  pskl.utils.inherit(ns.LassoSelect, ns.AbstractDragSelect);

  ns.LassoSelect.prototype.startDragSelection_ = function (col, row) {
    this.pixels = [{col : col, row : row}];
    this.previousCol = col;
    this.previousRow = row;
    $.publish(Events.DRAG_START, [col, row]);
  };

  ns.LassoSelect.prototype.updateDragSelection_ = function (col, row, color, frame, overlay) {
    col = pskl.utils.Math.minmax(col, 0, frame.getWidth() - 1);
    row = pskl.utils.Math.minmax(row, 0, frame.getHeight() - 1);
    this.addPixelToSelection_(col, row, frame);
    var additionnalPixels = this.getLinePixels_(col, this.startCol, row, this.startRow);

    // during the selection, create simple ShapeSelection, containing only the pixels hovered by the user
    this.selection = new pskl.selection.ShapeSelection(this.pixels.concat(additionnalPixels));
    $.publish(Events.SELECTION_CREATED, [this.selection]);

    overlay.clear();
    this.drawSelectionOnOverlay_(overlay);
  };

  ns.LassoSelect.prototype.endDragSelection_ = function (col, row, color, frame, overlay) {
    col = pskl.utils.Math.minmax(col, 0, frame.getWidth() - 1);
    row = pskl.utils.Math.minmax(row, 0, frame.getHeight() - 1);
    this.addPixelToSelection_(col, row, frame);
    var additionnalPixels = this.getLinePixels_(col, this.startCol, row, this.startRow);

    // finalize the selection, add all pixels contained inside the shape drawn by the user to the selection
    this.selection = new pskl.selection.LassoSelection(this.pixels.concat(additionnalPixels), frame);
    $.publish(Events.SELECTION_CREATED, [this.selection]);

    overlay.clear();
    this.drawSelectionOnOverlay_(overlay);

    $.publish(Events.DRAG_END, [col, row]);
  };

  ns.LassoSelect.prototype.addPixelToSelection_ = function (col, row, frame) {
    var interpolatedPixels = this.getLinePixels_(col, this.previousCol, row, this.previousRow);
    this.pixels = this.pixels.concat(interpolatedPixels);

    this.previousCol = col;
    this.previousRow = row;
  };
})();
