(function () {
  var ns = $.namespace('pskl.controller.piskel');

  ns.PiskelController = function (piskel) {
    if (piskel) {
      this.setPiskel(piskel);
    } else {
      throw 'A piskel instance is mandatory for instanciating PiskelController';
    }
  };

  /**
   * Set the current piskel. Will reset the selected frame and layer unless specified
   * @param {Object} piskel
   * @param {Boolean} preserveState if true, keep the selected frame and layer
   */
  ns.PiskelController.prototype.setPiskel = function (piskel, preserveState) {
    this.piskel = piskel;
    if (!preserveState) {
      this.currentPlaneIndex = 0;
      this.currentLayerIndex = 0;
      this.currentFrameIndex = 0;
    }

    this.planeIdCounter = 1;
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

  ns.PiskelController.prototype.getPlanes = function () {
    return this.piskel.getPlanes();
  };

  ns.PiskelController.prototype.getCurrentPlane = function () {
    return this.getPlaneAt(this.currentPlaneIndex);
  };

  ns.PiskelController.prototype.getPlaneAt = function (index) {
    return this.piskel.getPlaneAt(index);
  };

  ns.PiskelController.prototype.hasPlaneAt = function (index) {
    return !!this.getPlaneAt(index);
  };

  // FIXME ?? No added value compared to getPlaneAt ??
  // Except normalizing to null if undefined ?? ==> To merge
  ns.PiskelController.prototype.getPlaneByIndex = function (index) {
    var planes = this.getPlanes();
    if (planes[index]) {
      return planes[index];
    } else {
      return null;
    }
  };

  ns.PiskelController.prototype.getCurrentPlaneIndex = function () {
    return this.currentPlaneIndex;
  };

  ns.PiskelController.prototype.setCurrentPlaneIndex = function (index) {
    if (this.hasPlaneAt(index)) {
      this.currentPlaneIndex = index;
      this.setCurrentLayerIndex(0);
    } else {
      window.console.error('Could not set current plane index to ' + index);
    }
  };

  ns.PiskelController.prototype.selectPlane = function (plane) {
    var index = this.getPlanes().indexOf(plane);
    if (index != -1) {
      this.setCurrentPlaneIndex(index);
    }
  };

  ns.PiskelController.prototype.renamePlaneAt = function (index, name) {
    var plane = this.getPlaneByIndex(index);
    if (plane) {
      plane.setName(name);
    }
  };

  ns.PiskelController.prototype.setPlaneOffsetAt = function (index, offset) {
    var plane = this.getPlaneByIndex(index);
    if (plane) {
      plane.setOffset(offset);
    }
  };

  ns.PiskelController.prototype.generatePlaneName_ = function () {
    var name = 'Plane ' + this.planeIdCounter;
    while (this.hasPlaneForName_(name)) {
      this.planeIdCounter++;
      name = 'Plane ' + this.planeIdCounter;
    }
    return name;
  };

  ns.PiskelController.prototype.createPlane = function (name) {
    if (!name) {
      name = this.generatePlaneName_();
    }
    if (!this.hasPlaneForName_(name)) {
      var plane = new pskl.model.Plane(name);

      for (var l = 0; l < this.getLayers().length; l++) {
        var layer = new pskl.model.Layer('Layer ' + (l + 1));
        for (var i = 0 ; i < this.getFrameCount() ; i++) {
          layer.addFrame(this.createEmptyFrame_());
        }
        plane.addLayer(layer);
      }

      this.setCurrentLayerIndex(0);
      this.piskel.addPlane(plane);
      this.setCurrentPlaneIndex(this.piskel.getPlanes().length - 1);

    } else {
      throw 'Plane name should be unique';
    }
  };

  ns.PiskelController.prototype.hasPlaneForName_ = function (name) {
    return this.piskel.getPlanesByName(name).length > 0;
  };

  ns.PiskelController.prototype.movePlaneUp = function () {
    var plane = this.getCurrentPlane();
    this.piskel.movePlaneUp(plane);
    this.selectPlane(plane);
  };

  ns.PiskelController.prototype.movePlaneDown = function () {
    var plane = this.getCurrentPlane();
    this.piskel.movePlaneDown(plane);
    this.selectPlane(plane);
  };

  ns.PiskelController.prototype.removeCurrentPlane = function () {
    var currentPlaneIndex = this.getCurrentPlaneIndex();
    this.removePlaneAt(currentPlaneIndex);
  };

  ns.PiskelController.prototype.removePlaneAt = function (index) {
    if (this.getPlanes().length > 1) {
      var plane = this.getPlaneAt(index);
      if (plane) {
        this.piskel.removePlane(plane);
        this.setCurrentPlaneIndex(0);
      }
    }
  };

  /**
   * TODO : this should be removed
   * FPS should be stored in the Piskel model and not in the
   * previewController
   * Then piskelController should be able to return this information
   * @return {Number} Frames per second for the current animation
   */
  ns.PiskelController.prototype.getFPS = function () {
    return pskl.app.previewController.getFPS();
  };

  ns.PiskelController.prototype.getLayers = function () {
    return this.getCurrentPlane().getLayers();
  };

  ns.PiskelController.prototype.getCurrentLayer = function () {
    return this.getCurrentPlane().getLayerAt(this.currentLayerIndex);
  };

  ns.PiskelController.prototype.getLayerAt = function (index) {
    return this.getCurrentPlane().getLayerAt(index);
  };

  ns.PiskelController.prototype.hasLayerAt = function (index) {
    return !!this.getCurrentPlane().getLayerAt(index);
  };

  // FIXME ?? No added value compared to getLayerAt ??
  // Except normalizing to null if undefined ?? ==> To merge
  ns.PiskelController.prototype.getLayerByIndex = function (index) {
    var layers = this.getLayers();
    if (layers[index]) {
      return layers[index];
    } else {
      return null;
    }
  };

  ns.PiskelController.prototype.getCurrentFrame = function () {
    var layer = this.getCurrentLayer();
    return layer.getFrameAt(this.currentFrameIndex);
  };

  ns.PiskelController.prototype.getCurrentLayerIndex = function () {
    return this.currentLayerIndex;
  };

  ns.PiskelController.prototype.getCurrentFrameIndex = function () {
    return this.currentFrameIndex;
  };

  ns.PiskelController.prototype.getPiskel = function () {
    return this.piskel;
  };

  ns.PiskelController.prototype.isTransparent = function () {
    return this.getLayers().some(function (l) {
      return l.isTransparent();
    });
  };

  ns.PiskelController.prototype.renderFrameAt =
    function (index, preserveOpacity) {
      return pskl.utils.LayerUtils.flattenFrameAt(this.getLayers(), index, preserveOpacity);
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
    this.getPlanes().forEach(function (p) {
      p.getLayers().forEach(function (l) {
        l.addFrameAt(this.createEmptyFrame_(), index);
      }, this);
    }, this);

    this.setCurrentFrameIndex(index);
  };

  ns.PiskelController.prototype.createEmptyFrame_ = function () {
    var w = this.piskel.getWidth();
    var h = this.piskel.getHeight();
    return new pskl.model.Frame(w, h);
  };

  ns.PiskelController.prototype.removeFrameAt = function (index) {
    this.getPlanes().forEach(function (p) {
      p.getLayers().forEach(function (l) {
        l.removeFrameAt(index);
      }, this);
    }, this);

    // Current frame index is impacted if the removed frame was before the current frame
    if (this.currentFrameIndex >= index && this.currentFrameIndex > 0) {
      this.setCurrentFrameIndex(this.currentFrameIndex - 1);
    }
  };

  ns.PiskelController.prototype.duplicateCurrentFrame = function () {
    this.duplicateFrameAt(this.currentFrameIndex);
  };

  ns.PiskelController.prototype.duplicateFrameAt = function (index) {
    this.getPlanes().forEach(function (p) {
      p.getLayers().forEach(function (l) {
        l.duplicateFrameAt(index);
      }, this);
    }, this);

    this.setCurrentFrameIndex(index + 1);
  };

  ns.PiskelController.prototype.moveFrame = function (fromIndex, toIndex) {
    this.getPlanes().forEach(function (p) {
      p.getLayers().forEach(function (l) {
        l.moveFrame(fromIndex, toIndex);
      }, this);
    }, this);
  };

  ns.PiskelController.prototype.getFrameCount = function () {
    var layer = this.getCurrentPlane().getLayerAt(0);
    return layer.size();
  };

  ns.PiskelController.prototype.setCurrentFrameIndex = function (index) {
    if (this.hasFrameAt(index)) {
      this.currentFrameIndex = index;
    } else {
      window.console.error('Could not set current frame index to ' + index);
    }
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
    if (this.hasLayerAt(index)) {
      this.currentLayerIndex = index;
    } else {
      window.console.error('Could not set current layer index to ' + index);
    }
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

  ns.PiskelController.prototype.setLayerOffsetAt = function (index, offset) {
    var layer = this.getLayerByIndex(index);
    if (layer) {
      layer.setOffset(offset);
    }
  };

  ns.PiskelController.prototype.setLayerOpacityAt = function (index, opacity) {
    var layer = this.getLayerByIndex(index);
    if (layer) {
      layer.setOpacity(opacity);
    }
  };

  ns.PiskelController.prototype.mergeDownLayerAt = function (index) {
    var layer = this.getLayerByIndex(index);
    var downLayer = this.getLayerByIndex(index - 1);
    if (layer && downLayer) {
      var mergedLayer = pskl.utils.LayerUtils.mergeLayers(layer, downLayer);
      this.removeLayerAt(index);
      this.getCurrentPlane().addLayerAt(mergedLayer, index);
      this.removeLayerAt(index - 1);
      this.selectLayer(mergedLayer);
    }
  };

  ns.PiskelController.prototype.generateLayerName_ = function () {
    var name = 'Layer ' + this.layerIdCounter;
    while (this.hasLayerForName_(name)) {
      this.layerIdCounter++;
      name = 'Layer ' + this.layerIdCounter;
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
      this.getCurrentPlane().addLayer(layer);
      this.setCurrentLayerIndex(this.getCurrentPlane().getLayers().length - 1);

    } else {
      throw 'Layer name should be unique';
    }
  };

  ns.PiskelController.prototype.hasLayerForName_ = function (name) {
    return this.getCurrentPlane().getLayersByName(name).length > 0;
  };

  ns.PiskelController.prototype.moveLayerUp = function () {
    var layer = this.getCurrentLayer();
    this.getCurrentPlane().moveLayerUp(layer);
    this.selectLayer(layer);
  };

  ns.PiskelController.prototype.moveLayerDown = function () {
    var layer = this.getCurrentLayer();
    this.getCurrentPlane().moveLayerDown(layer);
    this.selectLayer(layer);
  };

  ns.PiskelController.prototype.removeCurrentLayer = function () {
    var currentLayerIndex = this.getCurrentLayerIndex();
    this.removeLayerAt(currentLayerIndex);
  };

  ns.PiskelController.prototype.removeLayerAt = function (index) {
    if (this.getLayers().length > 1) {
      var layer = this.getLayerAt(index);
      if (layer) {
        this.getCurrentPlane().removeLayer(layer);
        this.setCurrentLayerIndex(0);
      }
    }
  };

  ns.PiskelController.prototype.serialize = function (expanded) {
    return pskl.utils.Serializer.serializePiskel(this.piskel, expanded);
  };
})();
