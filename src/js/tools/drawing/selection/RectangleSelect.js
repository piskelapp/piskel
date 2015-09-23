/**
 * @provide pskl.tools.drawing.selection.RectangleSelect
 *
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace('pskl.tools.drawing.selection');

  ns.RectangleSelect = function() {
    this.toolId = 'tool-rectangle-select';
    this.helpText = 'Rectangle selection';

    ns.AbstractDragSelect.call(this);
  };

  pskl.utils.inherit(ns.RectangleSelect, ns.AbstractDragSelect);

  /** @override */
  ns.RectangleSelect.prototype.startDragSelection_ = function (col, row) {
    $.publish(Events.DRAG_START, [col, row]);
  };

  /**
   * When creating the rectangle selection, we clear the current overlayFrame and
   * redraw the current rectangle based on the orgin coordinate and
   * the current mouse coordiinate in sprite.
   * @override
   */
  ns.RectangleSelect.prototype.updateDragSelection_ = function (col, row, color, frame, overlay) {
    overlay.clear();
    this.selection = new pskl.selection.RectangularSelection(this.startCol, this.startRow, col, row);
    $.publish(Events.SELECTION_CREATED, [this.selection]);
    this.drawSelectionOnOverlay_(overlay);
  };

  /** @override */
  ns.RectangleSelect.prototype.endDragSelection_ = function (col, row, color, frame, overlay) {
    this.onSelect_(col, row, color, frame, overlay);
    $.publish(Events.DRAG_END);
  };

})();
