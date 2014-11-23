(function () {
  var ns = $.namespace('pskl.controller.drawing');

  /**
   * Multiplier applied between the mouse movement and viewport movement
   * @type {Number}
   */
  var MULTIPLIER = 2;

  /**
   * Dedicated handler to drag the drawing canvas using the mouse
   * Will store the initial coordinates as well as the status of the drag
   * @param {DrawingController} drawingController
   */
  ns.DragHandler = function (drawingController) {
    this.drawingController = drawingController;

    this.isDragging_ = false;
    this.updateOrigin_(-1, -1);
  };

  /**
   * Initialize a drag session.
   * @param {Number} x : x coordinate of the mouse event that initiated the drag
   * @param {Number} y : y coordinate of the mouse event that initiated the drag
   */
  ns.DragHandler.prototype.startDrag = function (x, y) {
    var coords = this.drawingController.getSpriteCoordinates(x, y);
    this.updateOrigin_(coords.x, coords.y);
  };

  /**
   * Update the drag status
   * @param {Number} x : x coordinate of the mouse event that triggered the update
   * @param {Number} y : y coordinate of the mouse event that triggered the update
   */
  ns.DragHandler.prototype.updateDrag = function (x, y) {
    var currentOffset = this.drawingController.getOffset();
    var offset = this.calculateOffset_(x, y);
    if (currentOffset.y !== offset.y || currentOffset.x !== offset.x) {
      this.isDragging_ = true;
      this.drawingController.setOffset(offset.x, offset.y);

      // retrieve the updated coordinates after moving the sprite
      // and store them as the new drag origin
      var coords = this.drawingController.getSpriteCoordinates(x, y);
      this.updateOrigin_(coords.x, coords.y);
    }
  };

  /**
   * Stop the drag session
   */
  ns.DragHandler.prototype.stopDrag = function () {
    this.isDragging_ = false;
    this.origin = null;
  };

  /**
   * Will return true if the drag handler effectively MOVED the offset
   * during the current drag session
   */
  ns.DragHandler.prototype.isDragging = function () {
    return this.isDragging_;
  };

  ns.DragHandler.prototype.calculateOffset_ = function (x, y) {
    var coords = this.drawingController.getSpriteCoordinates(x, y);
    var currentOffset = this.drawingController.getOffset();

    var offset = {
      x : currentOffset.x - MULTIPLIER * (coords.x - this.origin.x),
      y : currentOffset.y - MULTIPLIER * (coords.y - this.origin.y)
    };

    return offset;
  };

  ns.DragHandler.prototype.updateOrigin_ = function (x, y) {
    this.origin = this.origin || {};
    this.origin.x = x;
    this.origin.y = y;
  };
})();