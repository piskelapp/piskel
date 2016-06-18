//TODO: Deserialize multi-plane piskels !
(function () {
  var ns = $.namespace('pskl.utils.serialization');

  ns.Deserializer = function (data, callback) {
    this.layersToLoad_ = 0;
    this.data_ = data;
    this.callback_ = callback;
    this.piskel_ = null;
    this.planes_ = [];
    this.layers_ = [];
  };

  ns.Deserializer.deserialize = function (data, callback) {
    var deserializer;
    if (data.modelVersion == Constants.MODEL_VERSION) {
      deserializer = new ns.Deserializer(data, callback);
    } else if (data.modelVersion == 1) {
      deserializer = new ns.backward.Deserializer_v1(data, callback);
    } else {
      deserializer = new ns.backward.Deserializer_v0(data, callback);
    }
    deserializer.deserialize();
  };

  ns.Deserializer.prototype.deserialize = function (name) {
    var data = this.data_;
    var piskelData = data.piskel;
    name = name || 'Deserialized piskel';

    var descriptor = new pskl.model.piskel.Descriptor(name, '', false, piskelData.isMultiPlane);
    this.piskel_ = new pskl.model.Piskel(piskelData.width, piskelData.height, descriptor);

    if (descriptor.isMultiPlane !== true) {
      this.plane_ = new pskl.model.Plane('Root');
      this.planesToLoad_ = 1;
      this.layersToLoad_ = piskelData.layers.length;
      if (piskelData.expanded) {
        piskelData.layers.forEach(this.loadExpandedLayer.bind(this));
      } else {
        piskelData.layers.forEach(this.deserializeLayer.bind(this));
      }
    } else {
      this.planesToLoad_ = piskelData.planes.length;
      piskelData.planes.forEach(this.deserializePlane.bind(this));
    }
  };

  ns.Deserializer.prototype.deserializePlane = function (plane) {
    var data = this.data_;
    var piskelData = data.piskel;
    this.plane_ = new pskl.model.Plane(plane.name);
    this.plane_.setOffset(plane.offset);
    this.layersToLoad_ = plane.layers.length;
    if (piskelData.expanded) {
      plane.layers.forEach(this.loadExpandedLayer.bind(this));
    } else {
      plane.layers.forEach(this.deserializeLayer.bind(this));
    }
  };

  ns.Deserializer.prototype.deserializeLayer = function (layerString, index) {
    var layerData = JSON.parse(layerString);
    var layer = new pskl.model.Layer(layerData.name);
    layer.setOpacity(layerData.opacity);

    // 1 - create an image to load the base64PNG representing the layer
    var base64PNG = layerData.base64PNG;
    var image = new Image();

    // 2 - attach the onload callback that will be triggered asynchronously
    image.onload = function () {
      // 5 - extract the frames from the loaded image
      var frames = pskl.utils.LayerUtils.createFramesFromSpritesheet(image, layerData.frameCount);
      // 6 - add each image to the layer
      this.addFramesToLayer(frames, layer, index);
    }.bind(this);

    // 3 - set the source of the image
    image.src = base64PNG;
    return layer;
  };

  ns.Deserializer.prototype.loadExpandedLayer = function (layerData, index) {
    var layer = new pskl.model.Layer(layerData.name);
    layer.setOpacity(layerData.opacity);
    var frames = layerData.grids.map(function (grid) {
      return pskl.model.Frame.fromPixelGrid(grid);
    });
    this.addFramesToLayer(frames, layer, index);
    return layer;
  };

  ns.Deserializer.prototype.addFramesToLayer = function (frames, layer, index) {
    frames.forEach(layer.addFrame.bind(layer));

    this.layers_[index] = layer;
    this.onLayerLoaded_();
  };

  ns.Deserializer.prototype.onLayerLoaded_ = function () {
    this.layersToLoad_ = this.layersToLoad_ - 1;
    if (this.layersToLoad_ === 0) {
      this.layers_.forEach(function (layer) {
        this.plane_.addLayer(layer);
      }.bind(this));
      this.layers_ = [];
      this.planes_.push(this.plane_);
      this.onPlaneLoaded_();
    }
  };

  ns.Deserializer.prototype.onPlaneLoaded_ = function () {
    this.planesToLoad_--;
    if (this.planesToLoad_ === 0) {
      // ugly this-ref
      var _this = this;
      this.planes_.forEach(function (plane) {
        _this.piskel_.addPlane(plane);
      });
      this.callback_(this.piskel_);
    }
  };
})();
