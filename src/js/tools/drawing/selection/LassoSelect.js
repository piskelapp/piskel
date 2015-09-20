/**
 * @provide pskl.tools.drawing.ShapeSelect
 *
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace('pskl.tools.drawing');

  ns.LassoSelect = function() {
    this.toolId = 'tool-lasso-select';

    this.helpText = 'Lasso selection';

    ns.BaseSelect.call(this);
    this.hasSelection = false;

    this.selectionOrigin_ = null;
  };

  pskl.utils.inherit(ns.LassoSelect, ns.BaseSelect);

  /**
   * @override
   */
  ns.LassoSelect.prototype.onSelectStart_ = function (col, row, color, frame, overlay) {
    this.selectionOrigin_ = {
      col : col,
      row : row
    };
    this.previousCol = col;
    this.previousRow = row;
    if (this.hasSelection) {
      this.hasSelection = false;
      overlay.clear();
      $.publish(Events.SELECTION_DISMISSED);
    } else {
      this.startSelection_(col, row);
      overlay.setPixel(col, row, color);
    }
  };

  ns.LassoSelect.prototype.startSelection_ = function (col, row) {
    this.hasSelection = true;
    this.pixels = [{col : col, row : row}];
    $.publish(Events.DRAG_START, [col, row]);
    // Drawing the first point of the rectangle in the fake overlay canvas:
  };

  /**
   * When creating the rectangle selection, we clear the current overlayFrame and
   * redraw the current rectangle based on the orgin coordinate and
   * the current mouse coordiinate in sprite.
   * @override
   */
  ns.LassoSelect.prototype.onSelect_ = function (col, row, color, frame, overlay) {
    if (!this.hasSelection && (this.selectionOrigin_.col !== col || this.selectionOrigin_.row !== row)) {
      this.startSelection_(col, row);
    }

    if (this.hasSelection) {
      if ((Math.abs(col - this.previousCol) > 1) || (Math.abs(row - this.previousRow) > 1)) {
        // The pen movement is too fast for the mousemove frequency, there is a gap between the
        // current point and the previously drawn one.
        // We fill the gap by calculating missing dots (simple linear interpolation) and draw them.
        var interpolatedPixels = this.getLinePixels_(col, this.previousCol, row, this.previousRow);
        this.pixels = this.pixels.concat(interpolatedPixels);
      } else {
        this.pixels.push({col : col, row : row});
      }

      this.previousCol = col;
      this.previousRow = row;

      // join lasso tail with origin
      var additionnalPixels = this.getLinePixels_(col, this.selectionOrigin_.col, row, this.selectionOrigin_.row);

      overlay.clear();
      this.selection = new pskl.selection.ShapeSelection(this.pixels.concat(additionnalPixels));
      $.publish(Events.SELECTION_CREATED, [this.selection]);
      this.drawSelectionOnOverlay_(overlay);
    }
  };

  ns.LassoSelect.prototype.onSelectEnd_ = function (col, row, color, frame, overlay) {
    if (this.hasSelection) {
      if ((Math.abs(col - this.previousCol) > 1) || (Math.abs(row - this.previousRow) > 1)) {
        // The pen movement is too fast for the mousemove frequency, there is a gap between the
        // current point and the previously drawn one.
        // We fill the gap by calculating missing dots (simple linear interpolation) and draw them.
        var interpolatedPixels = this.getLinePixels_(col, this.previousCol, row, this.previousRow);
        this.pixels = this.pixels.concat(interpolatedPixels);
      } else {
        this.pixels.push({col : col, row : row});
      }


      var additionnalPixels = this.getLinePixels_(col, this.selectionOrigin_.col, row, this.selectionOrigin_.row);
      this.pixels = this.pixels.concat(additionnalPixels);

      var shapePixels = [];
      var pixelsMap = {};
      this.pixels.forEach(function (p) {
        pixelsMap[p.col] = pixelsMap[p.col] || {};
        pixelsMap[p.col][p.row] = 1;
      });
      frame.forEachPixel(function (color, c, r) {
        if(this.isInPoly_(c, r, pixelsMap, frame)) {
          shapePixels.push({col : c, row : r});
        }
      }.bind(this));

      this.pixels = this.pixels.concat(shapePixels);

      this.selection = new pskl.selection.ShapeSelection(this.pixels);
      $.publish(Events.SELECTION_CREATED, [this.selection]);
      this.onSelect_(col, row, color, frame, overlay);
      $.publish(Events.DRAG_END, [col, row]);
    }
  };

  ns.LassoSelect.prototype.isInPoly_ = function (col, row, pixelsMap, frame) {

    if (pixelsMap[col] && pixelsMap[col][row]) {
      // already marked
      return pixelsMap[col][row] == 1;
    }

    var paintedPixels = [];
    var queue = [];
    var dy = [-1, 0, 1, 0];
    var dx = [0, 1, 0, -1];

    queue.push({'col': col, 'row': row});
    var isOut = false;
    var loopCount = 0;
    var cellCount = frame.getWidth() * frame.getHeight();
    while (queue.length > 0) {
      loopCount ++;

      var currentItem = queue.pop();
      paintedPixels.push({'col': currentItem.col, 'row': currentItem.row});

      for (var i = 0; i < 4; i++) {
        var nextCol = currentItem.col + dx[i];
        var nextRow = currentItem.row + dy[i];
        try {
          var isMarked = pixelsMap[nextCol] &&  pixelsMap[nextCol][nextRow];
          if (frame.containsPixel(nextCol, nextRow) && !isMarked && !this.isInPixels_(nextCol, nextRow, pixelsMap)) {
            queue.push({'col': nextCol, 'row': nextRow});

            pixelsMap[nextCol] = pixelsMap[nextCol] || {};
            pixelsMap[nextCol][nextRow] = 2;

            if ((nextCol === 0 || nextCol == frame.getWidth() - 1) || (nextRow === 0 || nextRow == frame.getHeight() - 1)) {
              isOut= true;
            }
          }
        } catch (e) {
          // Frame out of bound exception.
        }
      }

      // Security loop breaker:
      if (loopCount > 10 * cellCount) {
        console.log('loop breaker called');
        break;
      }
    }

    paintedPixels.forEach(function (p) {
      pixelsMap[p.col] = pixelsMap[p.col] || {};
      pixelsMap[p.col][p.row] = isOut ? -1 : 1;
    });

    return !isOut;
  };


  ns.LassoSelect.prototype.isInPixels_ = function (col, row, pixelsMap) {
    return pixelsMap[col] && pixelsMap[col][row] === 1;
  };
})();
