/**
 * @provide pskl.drawingtools.ShapeSelect
 *
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace("pskl.drawingtools");

  ns.ShapeSelect = function() {
    this.toolId = "tool-shape-select";

    this.shortHelpText = "Shape selection";
    this.helpText = [
      "<div class='tools-tooltip-container'>",
      "Shape selection {{shortcut}}<br/>",
      "<span class='tools-tooltip-modifier'>Drag the selection to move it. You may switch to other layers and frames.</span><br/>",
      this.getModifierHelpText('ctrl+c', 'Copy the selected area'),
      this.getModifierHelpText('ctrl+v', 'Paste the copied area'),
      "</div>"
    ].join("");

    ns.BaseSelect.call(this);
  };

  pskl.utils.inherit(ns.ShapeSelect, ns.BaseSelect);

  /**
   * For the shape select tool, you just need to click one time to create a selection.
   * So we jsut need to implement onSelectStart_ (no need for onSelect_ & onSelectEnd_)
   * @override
   */
  ns.ShapeSelect.prototype.onSelectStart_ = function (col, row, color, frame, overlay) {
    // Clean previous selection:
    $.publish(Events.SELECTION_DISMISSED);
    overlay.clear();

    // From the pixel cliked, get shape using an algorithm similar to the paintbucket one:
    var pixels = pskl.PixelUtils.getSimilarConnectedPixelsFromFrame(frame, col, row);
    this.selection = new pskl.selection.ShapeSelection(pixels);

    $.publish(Events.SELECTION_CREATED, [this.selection]);
    this.drawSelectionOnOverlay_(overlay);
  };

})();
