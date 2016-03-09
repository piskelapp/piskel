(function () {
  var ns = $.namespace('pskl.utils.serialization');

  ns.Deserializer = function (data, callback) {
    this.layersToLoad_ = 0;
    this.data_ = data;
    this.callback_ = callback;
    this.piskel_ = null;
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

    var descriptor = new pskl.model.piskel.Descriptor(name, '');
    this.piskel_ = new pskl.model.Piskel(piskelData.width, piskelData.height, descriptor);

    this.layersToLoad_ = piskelData.layers.length;
    if (piskelData.expanded) {
      piskelData.layers.forEach(this.loadExpandedLayer.bind(this));
    } else {
      piskelData.layers.forEach(this.deserializeLayer.bind(this));
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

    // 4 - return a pointer to the new layer instance
    return layer;
  };

  ns.Deserializer.prototype.loadExpandedLayer = function (layerData, index) {
    var layer = new pskl.model.Layer(layerData.name);
    var frames = layerData.grids.map(function (grid) {
      return pskl.model.Frame.fromPixelGrid(grid);
    });
    this.addFramesToLayer(frames, layer, index);

    // 4 - return a pointer to the new layer instance
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
        this.piskel_.addLayer(layer);
      }.bind(this));
      this.callback_(this.piskel_);
    }
  };
})();
