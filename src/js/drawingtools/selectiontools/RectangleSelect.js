/**
 * @provide pskl.drawingtools.RectangleSelect
 *
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace("pskl.drawingtools");

  ns.RectangleSelect = function() {
    this.toolId = "tool-rectangle-select";

    this.helpText = [
      "<div class='tools-tooltip-container'>",
      "Rectangle selection {{shortcut}}<br/>",
      "<span class='tools-tooltip-modifier'>Drag the selection to move it. You may switch to other layers and frames.</span><br/>",
      "<span class='tools-tooltip-modifier'><span class='tools-tooltip-modifier-button'>CTRL+C</span>Copy the selected area</span><br/>",
      "<span class='tools-tooltip-modifier'><span class='tools-tooltip-modifier-button'>CTRL+V</span>Paste the copied area</span><br/>",
      "</div>"
    ].join("");

    ns.BaseSelect.call(this);
    this.hasSelection = false;
  };

  pskl.utils.inherit(ns.RectangleSelect, ns.BaseSelect);


  /**
   * @override
   */
  ns.RectangleSelect.prototype.onSelectStart_ = function (col, row, color, frame, overlay) {
    if (this.hasSelection) {
      this.hasSelection = false;
      overlay.clear();
      $.publish(Events.SELECTION_DISMISSED);
    } else {
      this.hasSelection = true;
      $.publish(Events.DRAG_START, [col, row]);
      // Drawing the first point of the rectangle in the fake overlay canvas:
      overlay.setPixel(col, row, color);
    }
  };

  /**
   * When creating the rectangle selection, we clear the current overlayFrame and
   * redraw the current rectangle based on the orgin coordinate and
   * the current mouse coordiinate in sprite.
   * @override
   */
  ns.RectangleSelect.prototype.onSelect_ = function (col, row, color, frame, overlay) {
    if (this.hasSelection) {
      overlay.clear();
      this.selection = new pskl.selection.RectangularSelection(
        this.startCol, this.startRow, col, row);
      $.publish(Events.SELECTION_CREATED, [this.selection]);
      this.drawSelectionOnOverlay_(overlay);
    }
  };

  ns.RectangleSelect.prototype.onSelectEnd_ = function (col, row, color, frame, overlay) {
    if (this.hasSelection) {
      this.onSelect_(col, row, color, frame, overlay);
      $.publish(Events.DRAG_END, [col, row]);
    }
  };

})();
