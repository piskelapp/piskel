(function () {
  var ns = $.namespace('pskl.controller');

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

    $.publish(Events.FRAME_SIZE_CHANGED);
    $.publish(Events.PISKEL_RESET);
  };

  ns.PiskelController.prototype.init = function () {
    pskl.app.shortcutService.addShortcut('up', this.selectPreviousFrame.bind(this));
    pskl.app.shortcutService.addShortcut('down', this.selectNextFrame.bind(this));
    pskl.app.shortcutService.addShortcut('n', this.addFrameAtCurrentIndex.bind(this));
    pskl.app.shortcutService.addShortcut('shift+n', this.duplicateCurrentFrame.bind(this));
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

  ns.PiskelController.prototype.addFrame = function () {
    this.addFrameAt(this.getFrameCount());
  };

  ns.PiskelController.prototype.addFrameAtCurrentIndex = function () {
    this.addFrameAt(this.currentFrameIndex + 1);
  };

  ns.PiskelController.prototype.addFrameAt = function (index) {
    var layers = this.getLayers();
    layers.forEach(function (l) {
      l.addFrameAt(this.createEmptyFrame_(), index);
    }.bind(this));

    $.publish(Events.PISKEL_RESET);
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

  ns.PiskelController.prototype.duplicateCurrentFrame = function () {
    this.duplicateFrameAt(this.currentFrameIndex);
  };

  ns.PiskelController.prototype.duplicateFrameAt = function (index) {
    var layers = this.getLayers();
    layers.forEach(function (l) {
      l.duplicateFrameAt(index);
    });

    $.publish(Events.PISKEL_RESET);
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

  ns.PiskelController.prototype.load = function (data) {
    this.deserialize(JSON.stringify(data));
  };
})();