(function () {
  var ns = $.namespace('pskl.utils.serialization');

  ns.Deserializer = function (data, callback) {
    this.layersToLoad_ = 0;
    this.data_ = data;
    this.callback_ = callback;
    this.piskel_ = null;
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

  ns.Deserializer.prototype.deserialize = function () {
    var data = this.data_;
    var piskelData = data.piskel;

    var descriptor = new pskl.model.piskel.Descriptor('Deserialized piskel', '');
    this.piskel_ = new pskl.model.Piskel(piskelData.width, piskelData.height, descriptor);

    this.layersToLoad_ = piskelData.layers.length;

    piskelData.layers.forEach(function (serializedLayer) {
      var layer = this.deserializeLayer(serializedLayer);
      this.piskel_.addLayer(layer);
    }.bind(this));
  };

  ns.Deserializer.prototype.deserializeLayer = function (layerString) {
    var layerData = JSON.parse(layerString);
    var layer = new pskl.model.Layer(layerData.name);

    // 1 - create an image to load the base64PNG representing the layer
    var base64PNG = layerData.base64PNG;
    var image = new Image();

    // 2 - attach the onload callback that will be triggered asynchronously
    image.onload = function () {
      // 5 - extract the frames from the loaded image
      var frames = pskl.utils.LayerUtils.createFromImage(image, layerData.frameCount);

      // 6 - add each image to the layer
      frames.forEach(layer.addFrame.bind(layer));

      this.onLayerLoaded_();
    }.bind(this);

    // 3 - set the source of the image
    image.src = base64PNG;

    // 4 - return a pointer to the new layer instance
    return layer;
  };

  ns.Deserializer.prototype.onLayerLoaded_ = function () {
    this.layersToLoad_ = this.layersToLoad_ - 1;
    if (this.layersToLoad_ === 0) {
      this.callback_(this.piskel_);
    }
  };
})();