(function () {
  var ns = $.namespace('pskl.controller');

  ns.PiskelController = function (piskel) {
    this.setPiskel(piskel);
  };

  ns.PiskelController.prototype.setPiskel = function (piskel) {
    this.piskel = piskel;
    this.currentLayerIndex = 0;
    this.currentFrameIndex = 0;

    this.layerIdCounter = 1;

    $.publish(Events.PISKEL_RESET);
    $.publish(Events.FRAME_SIZE_CHANGED);
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
    return this.piskel.getLayerAt(this.currentLayerIndex);
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

  // backward from framesheet
  ns.PiskelController.prototype.getFrameByIndex =
    ns.PiskelController.prototype.getMergedFrameAt;

  ns.PiskelController.prototype.addEmptyFrame = function () {
    var layers = this.getLayers();
    layers.forEach(function (l) {
      l.addFrame(this.createEmptyFrame_());
    }.bind(this));
  };

  ns.PiskelController.prototype.createEmptyFrame_ = function () {
    var w = this.piskel.getWidth(), h = this.piskel.getHeight();
    return new pskl.model.Frame(w, h);
  };

  ns.PiskelController.prototype.removeFrameAt = function (index) {
    var layers = this.getLayers();
    layers.forEach(function (l) {
      l.removeFrameAt(index);
    });
    // Current frame index is impacted if the removed frame was before the current frame
    if (this.currentFrameIndex >= index) {
      this.setCurrentFrameIndex(this.currentFrameIndex - 1);
    }

    $.publish(Events.PISKEL_RESET);
  };

  ns.PiskelController.prototype.duplicateFrameAt = function (index) {
    var layers = this.getLayers();
    layers.forEach(function (l) {
      l.duplicateFrameAt(index);
    });
  };

  ns.PiskelController.prototype.moveFrame = function (fromIndex, toIndex) {
    var layers = this.getLayers();
    layers.forEach(function (l) {
      l.moveFrame(fromIndex, toIndex);
    });
  };

  ns.PiskelController.prototype.getFrameCount = function () {
    var layer = this.piskel.getLayerAt(0);
    return layer.length();
  };

  ns.PiskelController.prototype.setCurrentFrameIndex = function (index) {
    this.currentFrameIndex = index;
    $.publish(Events.PISKEL_RESET);
  };

  ns.PiskelController.prototype.setCurrentLayerIndex = function (index) {
    this.currentLayerIndex = index;
    $.publish(Events.PISKEL_RESET);
  };

  ns.PiskelController.prototype.selectLayer = function (layer) {
    var index = this.getLayers().indexOf(layer);
    if (index != -1) {
      this.setCurrentLayerIndex(index);
    }
  };

  ns.PiskelController.prototype.selectLayerByName = function (name) {
    if (this.hasLayerForName_(name)) {
      var layer = this.piskel.getLayersByName(name)[0];
      this.selectLayer(layer);
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

  ns.PiskelController.prototype.serialize = function () {
    return pskl.utils.Serializer.serializePiskel(this.piskel);
  };

  ns.PiskelController.prototype.deserialize = function (json) {
    try {
      var piskel = pskl.utils.Serializer.deserializePiskel(json);
      this.setPiskel(piskel);
    } catch (e) {
      console.error('Failed to deserialize');
      console.error(e.stack);
    }
  };
})();