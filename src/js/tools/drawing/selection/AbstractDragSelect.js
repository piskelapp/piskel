/**
 * Base class for all select tools that use a dragging mechanism to define the selection.
 *
 * @provide pskl.tools.drawing.selection.AbstractDragSelect
 */
(function () {
  var ns = $.namespace('pskl.tools.drawing.selection');

  ns.AbstractDragSelect = function () {
    ns.BaseSelect.call(this);
    this.hasSelection = false;
  };

  pskl.utils.inherit(ns.AbstractDragSelect, ns.BaseSelect);

  /** @override */
  ns.AbstractDragSelect.prototype.onSelectStart_ = function (col, row, color, frame, overlay) {
    if (this.hasSelection) {
      this.hasSelection = false;
      overlay.clear();
      $.publish(Events.SELECTION_DISMISSED);
    } else {
      this.hasSelection = true;
      this.startDragSelection_(col, row);
      overlay.setPixel(col, row, this.getTransparentVariant_(Constants.SELECTION_TRANSPARENT_COLOR));
    }
  };

  /** @override */
  ns.AbstractDragSelect.prototype.onSelect_ = function (col, row, color, frame, overlay) {
    if (!this.hasSelection && (this.startCol !== col || this.startRow !== row)) {
      this.hasSelection = true;
      this.startDragSelection_(col, row);
    }

    if (this.hasSelection) {
      this.updateDragSelection_(col, row, color, frame, overlay);
    }
  };

  /** @override */
  ns.AbstractDragSelect.prototype.onSelectEnd_ = function (col, row, color, frame, overlay) {
    if (this.hasSelection) {
      this.endDragSelection_(col, row, color, frame, overlay);
    }
  };

  /** @protected */
  ns.AbstractDragSelect.prototype.startDragSelection_ = function (col, row, color, frame, overlay) {};
  /** @protected */
  ns.AbstractDragSelect.prototype.updateDragSelection_ = function (col, row, color, frame, overlay) {};
  /** @protected */
  ns.AbstractDragSelect.prototype.endDragSelection_ = function (col, row, color, frame, overlay) {};
})();
