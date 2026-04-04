/**
 * @provide pskl.tools.drawing.selection.BaseSelect
 *
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace('pskl.tools.drawing.selection');

  ns.BaseSelect = function() {
    this.secondaryToolId = pskl.tools.drawing.Move.TOOL_ID;

    // Select's first point coordinates (set in applyToolAt)
    this.startCol = null;
    this.startRow = null;

    this.lastMoveCol = null;
    this.lastMoveRow = null;

    this.selection = null;
    this.hasSelection = false;

    this.tooltipDescriptors = [
      {description : 'Drag the selection to move it. You may switch to other layers and frames.'},
      {key : 'ctrl+c', description : 'Copy the selected area'},
      {key : 'ctrl+v', description : 'Paste the copied area'},
      {key : 'shift', description : 'Hold to move the content'}
    ];

    $.subscribe(Events.SELECTION_DISMISSED, this.onSelectionDismissed_.bind(this));
  };

  pskl.utils.inherit(ns.BaseSelect, pskl.tools.drawing.BaseTool);

  /**
   * @override
   */
  ns.BaseSelect.prototype.applyToolAt = function(col, row, frame, overlay, event) {
    this.startCol = col;
    this.startRow = row;

    this.lastMoveCol = col;
    this.lastMoveRow = row;

    // The select tool can be in three different state.
    // If the initial click of the tool is not on a selection, we go in 'select'
    // mode to create a selection.
    // If the initial click of the tool is at the bottom right of the selection, we go in 'resize'
    // mode to allow to resize the selection.
    // If the initial click is on a previous selection, we go in 'moveSelection'
    // mode to allow to move the selection by drag'n dropping it.
    if (!this.isInSelection(col, row)) {
      this.mode = 'select';
      this.onSelectStart_(col, row, frame, overlay);
    } else if (this.isResizeEnabled_() && this.isAtBottomRight_(col, row)) {
      this.mode = 'resize';
      if (this.isMovingContent_) {
        this.referenceFrame = pskl.model.Frame.createEmptyFromFrame(frame);
        this.selection.pasteToFrame(this.referenceFrame);
      } else {
        this.isMovingContent_ = true;
        this.referenceFrame = frame.clone();
        $.publish(Events.CLIPBOARD_CUT);
      }
      this.drawSelectionOnOverlay_(overlay);
      this.onSelectionResizeStart_(col, row, frame, overlay);
    } else {
      this.mode = 'moveSelection';
      if (event.shiftKey && !this.isMovingContent_) {
        this.isMovingContent_ = true;
        $.publish(Events.CLIPBOARD_CUT);
        this.drawSelectionOnOverlay_(overlay);
      }
      this.onSelectionMoveStart_(col, row, frame, overlay);
    }
  };

  /**
   * @override
   */
  ns.BaseSelect.prototype.moveToolAt = function(col, row, frame, overlay, event) {
    if (this.mode == 'resize') {
      this.onSelectionResize_(col, row, frame, overlay);
    } else if (this.mode == 'select') {
      this.onSelect_(col, row, frame, overlay);
    } else if (this.mode == 'moveSelection') {
      this.onSelectionMove_(col, row, frame, overlay);
    }
  };

  /**
   * @override
   */
  ns.BaseSelect.prototype.releaseToolAt = function(col, row, frame, overlay, event) {
    if (this.mode == 'select') {
      this.onSelectEnd_(col, row, frame, overlay);
    } else if (this.mode == 'moveSelection') {
      this.onSelectionMoveEnd_(col, row, frame, overlay);
    }
  };

  /**
   * If we mouseover the selection draw inside the overlay frame, show the 'move' cursor
   * instead of the 'select' one. It indicates that we can move the selection by dragndroping it.
   * @override
   */
  ns.BaseSelect.prototype.moveUnactiveToolAt = function(col, row, frame, overlay, event) {
    if (overlay.containsPixel(col, row)) {
      var resizeToolId = 'tool-resize';
      if (this.isResizeEnabled_() && this.isAtBottomRight_(col, row)) {
        // We're hovering the bottom right of selection, show the resize tool:
        document.body.classList.add(resizeToolId);
        document.body.classList.remove(this.toolId);
        document.body.classList.remove(this.secondaryToolId);
      } else if (this.isInSelection(col, row)) {
        // We're hovering the selection, show the move tool:
        document.body.classList.add(this.secondaryToolId);
        document.body.classList.remove(this.toolId);
        document.body.classList.remove(resizeToolId);
      } else {
        // We're not hovering the selection, show create selection tool:
        document.body.classList.add(this.toolId);
        document.body.classList.remove(this.secondaryToolId);
        document.body.classList.remove(resizeToolId);
      }
    }

    if (!this.hasSelection) {
      pskl.tools.drawing.BaseTool.prototype.moveUnactiveToolAt.apply(this, arguments);
    }
  };

  ns.BaseSelect.prototype.isInSelection = function (col, row) {
    return this.selection && this.selection.pixels.some(function (pixel) {
      return pixel.col === col && pixel.row === row;
    });
  };

  ns.BaseSelect.prototype.isAtBottomRight_ = function (col, row) {
    var bottomRight = this.getSelectionBottomRight_();
    if (!bottomRight) {
      return false;
    }

    return bottomRight.col === col && bottomRight.row === row;
  };

  ns.BaseSelect.prototype.getSelectionTopLeft_ = function () {
    if (!this.selection || !this.selection.pixels.length) {
      return null;
    }
    return this.selection.pixels[0];
  };

  ns.BaseSelect.prototype.getSelectionBottomRight_ = function () {
    if (!this.selection) {
      return null;
    }
    var lastPixel = this.selection.pixels[this.selection.pixels.length - 1];
    if (!lastPixel) {
      return null;
    }

    return lastPixel;
  };

  ns.BaseSelect.getScaleFactor_ = function (
    selectionTopLeft, col, row, originalSelectionWidth, originalSelectionHeight
  ) {
    var currentWidth = col - selectionTopLeft.col + 1;
    var currentHeight = row - selectionTopLeft.row + 1;

    var currentFactorH = currentWidth / originalSelectionWidth;
    var currentFactorV = currentHeight / originalSelectionHeight;

    var roundedFactorH = Math.floor(currentFactorH);
    var roundedFactorV = Math.floor(currentFactorV);

    var clampedFactorH = Math.max(1, roundedFactorH);
    var clampedFactorV = Math.max(1, roundedFactorV);

    return { h: clampedFactorH, v: clampedFactorV };
  };

  ns.BaseSelect.prototype.resizeSelection_ = function (selectionTopLeft, scaleFactor, reference) {
    var newSelectionX2 = selectionTopLeft.col + this.originalSelectionWidth * scaleFactor.h - 1;
    var newSelectionY2 = selectionTopLeft.row + this.originalSelectionHeight * scaleFactor.v - 1;
    // resize only works for rectangle select for now
    var newSelection = new pskl.selection.RectangularSelection(
      selectionTopLeft.col, selectionTopLeft.row,
      newSelectionX2, newSelectionY2
    );

    var tmpFrame = pskl.model.Frame.createEmptyFromFrame(reference);

    for (var i = 0; i < this.selection.pixels.length; i++) {
      var selectionPixel = this.selection.pixels[i];
      var color = reference.getPixel(selectionPixel.col, selectionPixel.row);

      if (!color) {
        continue;
      }

      var relativeCol = selectionPixel.col - selectionTopLeft.col;
      var relativeRow = selectionPixel.row - selectionTopLeft.row;

      for (var x = 0; x < scaleFactor.h; x++) {
        for (var y = 0; y < scaleFactor.v; y++) {
          var col = selectionTopLeft.col + relativeCol * scaleFactor.h + x;
          var row = selectionTopLeft.row + relativeRow * scaleFactor.v + y;
          tmpFrame.setPixel(col, row, color);
        }
      }
    }
    newSelection.fillSelectionFromFrame(tmpFrame);
    this.selection = newSelection;
    $.publish(Events.SELECTION_CREATED, [this.selection]);
  };

  /**
   * Protected method, should be called when the selection is committed,
   * typically by clicking outside of the selected area.
   */
  ns.BaseSelect.prototype.commitSelection = function () {
    if (this.isMovingContent_) {
      $.publish(Events.CLIPBOARD_PASTE);
      this.isMovingContent_ = false;
    }

    // Clean previous selection:
    $.publish(Events.SELECTION_DISMISSED);
  };

  /**
   * Protected method, should be called when the selection is dismissed.
   */
  ns.BaseSelect.prototype.onSelectionDismissed_ = function () {
    var overlay = pskl.app.drawingController.overlayFrame;
    overlay.clear();
    this.hasSelection = false;
  };

  /**
   * For each pixel in the selection draw it in white transparent on the tool overlay
   * @protected
   */
  ns.BaseSelect.prototype.drawSelectionOnOverlay_ = function (overlay) {
    var pixels = this.selection.pixels;
    for (var i = 0, l = pixels.length; i < l ; i++) {
      var pixel = pixels[i];
      var hasColor = pixel.color && pixel.color !== Constants.TRANSPARENT_COLOR ;
      var color = hasColor ? this.getTransparentVariant_(pixel.color) : Constants.SELECTION_TRANSPARENT_COLOR;

      overlay.setPixel(pixels[i].col, pixels[i].row, color);
    }
  };

  ns.BaseSelect.prototype.getTransparentVariant_ = pskl.utils.FunctionUtils.memo(function (colorStr) {
    var color = window.tinycolor(colorStr);
    color = window.tinycolor.lighten(color, 10);
    color.setAlpha(0.5);
    return color.toRgbString();
  }, {});

  /** @protected */
  ns.BaseSelect.prototype.isResizeEnabled_ = function () {
    return false;
  };

  // The list of callbacks to implement by specialized tools to implement the selection creation behavior.
  /** @protected */
  ns.BaseSelect.prototype.onSelectStart_ = function (col, row, frame, overlay) {};
  /** @protected */
  ns.BaseSelect.prototype.onSelect_ = function (col, row, frame, overlay) {};
  /** @protected */
  ns.BaseSelect.prototype.onSelectEnd_ = function (col, row, frame, overlay) {};

  // The list of callbacks that define the drag'n drop behavior of the selection.
  /** @private */

  ns.BaseSelect.prototype.onSelectionMoveStart_ = function (col, row, frame, overlay) {};

  /** @private */
  ns.BaseSelect.prototype.onSelectionMove_ = function (col, row, frame, overlay) {
    var deltaCol = col - this.lastMoveCol;
    var deltaRow = row - this.lastMoveRow;

    var colDiff = col - this.startCol;
    var rowDiff = row - this.startRow;

    this.selection.move(deltaCol, deltaRow);

    overlay.clear();
    this.drawSelectionOnOverlay_(overlay);

    this.lastMoveCol = col;
    this.lastMoveRow = row;
  };

  /** @private */
  ns.BaseSelect.prototype.onSelectionMoveEnd_ = function (col, row, frame, overlay) {
    this.onSelectionMove_(col, row, frame, overlay);
  };

  // The list of callbacks that define the drag'n drop behavior of selection resize.
  /** @private */
  ns.BaseSelect.prototype.onSelectionResizeStart_ = function (col, row, frame, overlay) {
    this.scaleFactor = { h: 1, v: 1};

    var selectionTopLeft = this.getSelectionTopLeft_();
    var selectionBottomRight = this.getSelectionBottomRight_();
    this.originalSelectionWidth = selectionBottomRight.col - selectionTopLeft.col + 1;
    this.originalSelectionHeight = selectionBottomRight.row - selectionTopLeft.row + 1;
  };
  /** @private */
  ns.BaseSelect.prototype.onSelectionResize_ = function (col, row, frame, overlay) {
    var selectionTopLeft = this.getSelectionTopLeft_();
    var newScaleFactor = ns.BaseSelect.getScaleFactor_(
      selectionTopLeft, col, row, this.originalSelectionWidth, this.originalSelectionHeight
    );
    if (newScaleFactor.h !== this.scaleFactor.h || newScaleFactor.v !== this.scaleFactor.v) {
      this.resizeSelection_(selectionTopLeft, newScaleFactor, this.referenceFrame);
    }

    this.scaleFactor = newScaleFactor;

    overlay.clear();
    this.drawSelectionOnOverlay_(overlay);
  };
})();
