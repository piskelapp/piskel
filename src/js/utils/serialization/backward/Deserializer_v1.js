(function () {
  var ns = $.namespace('pskl.utils.serialization.backward');

  ns.Deserializer_v1 = function (data, callback) {
    this.callback_ = callback;
    this.data_ = data;
  };

  ns.Deserializer_v1.prototype.deserialize = function () {
    var piskelData = this.data_.piskel;
    var descriptor = new pskl.model.piskel.Descriptor('Deserialized piskel', '');
    var piskel = new pskl.model.Piskel(piskelData.width, piskelData.height, Constants.DEFAULTS.FPS, descriptor);

    piskelData.layers.forEach(function (serializedLayer) {
      var layer = this.deserializeLayer(serializedLayer);
      piskel.addLayer(layer);
    }.bind(this));

    this.callback_(piskel);
  };

  ns.Deserializer_v1.prototype.deserializeLayer = function (layerString) {
    var layerData = JSON.parse(layerString);
    var layer = new pskl.model.Layer(layerData.name);
    layerData.frames.forEach(function (serializedFrame) {
      var frame = this.deserializeFrame(serializedFrame);
      layer.addFrame(frame);
    }.bind(this));

    return layer;
  };

  ns.Deserializer_v1.prototype.deserializeFrame = function (frameString) {
    var framePixelGrid = JSON.parse(frameString);
    return pskl.model.Frame.fromPixelGrid(framePixelGrid);
  };
})();
