(function () {
  var ns = $.namespace('pskl.model');

  ns.Layer = function (name) {
    if (!name) {
      throw 'Invalid arguments in Layer constructor : \'name\' is mandatory';
    } else {
      this.name = name;
      this.frames = [];
    }
  };

  ns.Layer.prototype.getName = function () {
    return this.name;
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
      throw 'Invalid index in removeFrameAt : ' + index + ' (size : ' + this.length() + ')';
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
      console.log('frames', this.frames);
      console.log('fromIndex', fromIndex, 'toIndex', toIndex);
      throw 'Frame not found in moveFrameAt';
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
      throw 'Frame not found in duplicateFrameAt';
    }
  };

  ns.Layer.prototype.length = function () {
    return this.frames.length;
  };
})();