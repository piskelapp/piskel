(function () {
  var ns = $.namespace('pskl.controller.piskel');

  ns.PiskelController = function (piskel) {
    if (piskel) {
      this.setPiskel(piskel);
    } else {
      throw 'A piskel instance is mandatory for instanciating PiskelController';
    }
  };

  ns.PiskelController.prototype.setPiskel = function (piskel) {
    this.piskel = piskel;
    this.currentLayerIndex = 0;
    this.currentFrameIndex = 0;

    this.layerIdCounter = 1;
  };

  ns.PiskelController.prototype.init = function () {
  };

  ns.PiskelController.prototype.getHeight = function () {
    return this.piskel.getHeight();
  };

  ns.PiskelController.prototype.getWidth = function () {
    return this.piskel.getWidth();
  };

  /**
   * TODO : this should be removed
   * FPS should be stored in the Piskel model and not in the
   * animationController
   * Then piskelController should be able to return this information
   * @return {Number} Frames per second for the current animation
   */
  ns.PiskelController.prototype.getFPS = function () {
    return pskl.app.animationController.getFPS();
  };

  ns.PiskelController.prototype.getLayers = function () {
    return this.piskel.getLayers();
  };

  ns.PiskelController.prototype.getCurrentLayer = function () {
    return this.getLayerAt(this.currentLayerIndex);
  };

  ns.PiskelController.prototype.getLayerAt = function (index) {
    return this.piskel.getLayerAt(index);
  };

  ns.PiskelController.prototype.getCurrentFrame = function () {
    var layer = this.getCurrentLayer();
    return layer.getFrameAt(this.currentFrameIndex);
  };

  ns.PiskelController.prototype.getFrameAt = function (index) {
    var frames = this.getLayers().map(function (l) {
      return l.getFrameAt(index);
    });
    return pskl.utils.FrameUtils.merge(frames);
  };

  ns.PiskelController.prototype.hasFrameAt = function (index) {
    return !!this.getCurrentLayer().getFrameAt(index);
  };

  ns.PiskelController.prototype.addFrame = function () {
    this.addFrameAt(this.getFrameCount());
  };

  ns.PiskelController.prototype.addFrameAtCurrentIndex = function () {
    this.addFrameAt(this.currentFrameIndex + 1);
  };

  ns.PiskelController.prototype.addFrameAt = function (index) {
    this.getLayers().forEach(function (l) {
      l.addFrameAt(this.createEmptyFrame_(), index);
    }.bind(this));
  };

  ns.PiskelController.prototype.createEmptyFrame_ = function () {
    var w = this.piskel.getWidth(), h = this.piskel.getHeight();
    return new pskl.model.Frame(w, h);
  };

  ns.PiskelController.prototype.removeFrameAt = function (index) {
    this.getLayers().forEach(function (l) {
      l.removeFrameAt(index);
    });
    // Current frame index is impacted if the removed frame was before the current frame
    if (this.currentFrameIndex >= index && this.currentFrameIndex > 0) {
      this.setCurrentFrameIndex(this.currentFrameIndex - 1);
    }
  };

  ns.PiskelController.prototype.duplicateCurrentFrame = function () {
    this.duplicateFrameAt(this.currentFrameIndex);
  };

  ns.PiskelController.prototype.duplicateFrameAt = function (index) {
    this.getLayers().forEach(function (l) {
      l.duplicateFrameAt(index);
    });
  };

  ns.PiskelController.prototype.moveFrame = function (fromIndex, toIndex) {
    this.getLayers().forEach(function (l) {
      l.moveFrame(fromIndex, toIndex);
    });
  };

  ns.PiskelController.prototype.getFrameCount = function () {
    var layer = this.piskel.getLayerAt(0);
    return layer.length();
  };

  ns.PiskelController.prototype.setCurrentFrameIndex = function (index) {
    this.currentFrameIndex = index;
  };

  ns.PiskelController.prototype.selectNextFrame = function () {
    var nextIndex = this.currentFrameIndex + 1;
    if (nextIndex < this.getFrameCount()) {
      this.setCurrentFrameIndex(nextIndex);
    }
  };

  ns.PiskelController.prototype.selectPreviousFrame = function () {
    var nextIndex = this.currentFrameIndex - 1;
    if (nextIndex >= 0) {
      this.setCurrentFrameIndex(nextIndex);
    }
  };

  ns.PiskelController.prototype.setCurrentLayerIndex = function (index) {
    this.currentLayerIndex = index;
  };

  ns.PiskelController.prototype.selectLayer = function (layer) {
    var index = this.getLayers().indexOf(layer);
    if (index != -1) {
      this.setCurrentLayerIndex(index);
    }
  };

  ns.PiskelController.prototype.renameLayerAt = function (index, name) {
    var layer = this.getLayerByIndex(index);
    if (layer) {
      layer.setName(name);
    }
  };

  ns.PiskelController.prototype.getLayerByIndex = function (index) {
    var layers = this.getLayers();
    if (layers[index]) {
      return layers[index];
    } else {
      return null;
    }
  };

  ns.PiskelController.prototype.generateLayerName_ = function () {
    var name = "Layer " + this.layerIdCounter;
    while (this.hasLayerForName_(name)) {
      this.layerIdCounter++;
      name = "Layer " + this.layerIdCounter;
    }
    return name;
  };

  ns.PiskelController.prototype.createLayer = function (name) {
    if (!name) {
      name = this.generateLayerName_();
    }
    if (!this.hasLayerForName_(name)) {
      var layer = new pskl.model.Layer(name);
      for (var i = 0 ; i < this.getFrameCount() ; i++) {
        layer.addFrame(this.createEmptyFrame_());
      }
      this.piskel.addLayer(layer);
      this.setCurrentLayerIndex(this.piskel.getLayers().length - 1);

    } else {
      throw 'Layer name should be unique';
    }
  };

  ns.PiskelController.prototype.hasLayerForName_ = function (name) {
    return this.piskel.getLayersByName(name).length > 0;
  };

  ns.PiskelController.prototype.moveLayerUp = function () {
    var layer = this.getCurrentLayer();
    this.piskel.moveLayerUp(layer);
    this.selectLayer(layer);
  };

  ns.PiskelController.prototype.moveLayerDown = function () {
    var layer = this.getCurrentLayer();
    this.piskel.moveLayerDown(layer);
    this.selectLayer(layer);
  };

  ns.PiskelController.prototype.removeCurrentLayer = function () {
    if (this.getLayers().length > 1) {
      var layer = this.getCurrentLayer();
      this.piskel.removeLayer(layer);
      this.setCurrentLayerIndex(0);
    }
  };

  ns.PiskelController.prototype.serialize = function (compressed) {
    return pskl.utils.Serializer.serializePiskel(this.piskel, compressed);
  };
})();