(function () {
  var ns = $.namespace('pskl.utils.serialization.backward');

  ns.Deserializer_v0 = function (data, callback) {
    this.data_ = data;
    this.callback_ = callback;
  };

  ns.Deserializer_v0.prototype.deserialize = function () {
    var pixelGrids = this.data_;
    var frames = pixelGrids.map(function (grid) {
      return pskl.model.Frame.fromPixelGrid(grid);
    });
    var descriptor = new pskl.model.piskel.Descriptor('Deserialized piskel', '');
    var layer = pskl.model.Layer.fromFrames('Layer 1', frames);

    this.callback_(pskl.model.Piskel.fromLayers([layer], Constants.DEFAULTS.FPS, descriptor));
  };
})();
