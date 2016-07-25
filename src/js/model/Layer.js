(function () {
  var ns = $.namespace('pskl.model');

  ns.Layer = function (name) {
    if (!name) {
      throw 'Invalid arguments in Layer constructor : \'name\' is mandatory';
    } else {
      this.name = name;
      this.frames = [];
      this.opacity = 1;
    }
  };

  /**
   * Create a Layer instance from an already existing set a Frames
   * @static
   * @param  {String} name layer's name
   * @param  {Array<pskl.model.Frame>} frames should all have the same dimensions
   * @return {pskl.model.Layer}
   */
  ns.Layer.fromFrames = function (name, frames) {
    var layer = new ns.Layer(name);
    frames.forEach(layer.addFrame.bind(layer));
    return layer;
  };

  ns.Layer.prototype.getName = function () {
    return this.name;
  };

  ns.Layer.prototype.setName = function (name) {
    this.name = name;
  };

  ns.Layer.prototype.getOpacity = function () {
    return this.opacity;
  };

  ns.Layer.prototype.setOpacity = function (opacity) {
    if (opacity === null || isNaN(opacity) || opacity < 0 || opacity > 1) {
      return;
    }
    this.opacity = opacity;
  };

  ns.Layer.prototype.isTransparent = function () {
    return this.opacity < 1;
  };

  ns.Layer.prototype.getFrames = function () {
    return this.frames;
  };

  ns.Layer.prototype.getFrameAt = function (index) {
    return this.frames[index];
  };

  ns.Layer.prototype.addFrame = function (frame) {
    this.frames.push(frame);
  };

  ns.Layer.prototype.addFrameAt = function (frame, index) {
    this.frames.splice(index, 0, frame);
  };

  ns.Layer.prototype.removeFrame = function (frame) {
    var index = this.frames.indexOf(frame);
    this.removeFrameAt(index);
  };

  ns.Layer.prototype.removeFrameAt = function (index) {
    if (this.frames[index]) {
      this.frames.splice(index, 1);
    } else {
      console.error('Invalid index in removeFrameAt : %s (size : %s)', index, this.size());
    }
  };

  ns.Layer.prototype.moveFrame = function (fromIndex, toIndex) {
    var frame = this.frames.splice(fromIndex, 1)[0];
    this.frames.splice(toIndex, 0, frame);
  };

  ns.Layer.prototype.swapFramesAt = function (fromIndex, toIndex) {
    var fromFrame = this.frames[fromIndex];
    var toFrame = this.frames[toIndex];
    if (fromFrame && toFrame) {
      this.frames[toIndex] = fromFrame;
      this.frames[fromIndex] = toFrame;
    } else {
      console.error('Frame not found in moveFrameAt (from %s, to %s)', fromIndex, toIndex);
    }
  };

  ns.Layer.prototype.duplicateFrame = function (frame) {
    var index = this.frames.indexOf(frame);
    this.duplicateFrameAt(index);
  };

  ns.Layer.prototype.duplicateFrameAt = function (index) {
    var frame = this.frames[index];
    if (frame) {
      var clone = frame.clone();
      this.addFrameAt(clone, index);
    } else {
      console.error('Frame not found in duplicateFrameAt (at %s)', index);
    }
  };

  ns.Layer.prototype.size = function () {
    return this.frames.length;
  };

  ns.Layer.prototype.getHash = function () {
    return this.frames.map(function (frame) {
      return frame.getHash();
    }).join('-');
  };
})();
