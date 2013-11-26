(function () {
  var ns = $.namespace('pskl.model');

  /**
   * @constructor
   * @param {Number} width
   * @param {Number} height
   */
  ns.Piskel = function (width, height) {
    if (width && height) {
      /** @type {Array} */
      this.layers = [];

      /** @type {Number} */
      this.width = width;

      /** @type {Number} */
      this.height = height;
    } else {
      throw 'Missing arguments in Piskel constructor : ' + Array.prototype.join.call(arguments, ",");
    }
  };

  /**
   * Create a piskel instance from an existing set of (non empty) layers
   * Layers should all be synchronized : same number of frames, same dimensions
   * @param  {Array<pskl.model.Layer>} layers
   * @return {pskl.model.Piskel}
   */
  ns.Piskel.fromLayers = function (layers) {
    var piskel = null;
    if (layers.length > 0 && layers[0].length() > 0) {
      var sampleFrame = layers[0].getFrameAt(0);
      piskel = new pskl.model.Piskel(sampleFrame.getWidth(), sampleFrame.getHeight());
      layers.forEach(piskel.addLayer.bind(piskel));
    } else {
      throw 'Piskel.fromLayers expects array of non empty pskl.model.Layer as first argument';
    }
    return piskel;
  };

  ns.Piskel.prototype.getLayers = function () {
    return this.layers;
  };

  ns.Piskel.prototype.getHeight = function () {
    return this.height;
  };

  ns.Piskel.prototype.getWidth = function () {
    return this.width;
  };

  ns.Piskel.prototype.getLayers = function () {
    return this.layers;
  };

  ns.Piskel.prototype.getLayerAt = function (index) {
    return this.layers[index];
  };

  ns.Piskel.prototype.getLayersByName = function (name) {
    return this.layers.filter(function (l) {
      return l.getName() == name;
    });
  };

  ns.Piskel.prototype.addLayer = function (layer) {
    this.layers.push(layer);
  };

  ns.Piskel.prototype.moveLayerUp = function (layer) {
    var index = this.layers.indexOf(layer);
    if (index > -1 && index < this.layers.length-1) {
      this.layers[index] = this.layers[index+1];
      this.layers[index+1] = layer;
    }
  };

  ns.Piskel.prototype.moveLayerDown = function (layer) {
    var index = this.layers.indexOf(layer);
    if (index > 0) {
      this.layers[index] = this.layers[index-1];
      this.layers[index-1] = layer;
    }
  };

  ns.Piskel.prototype.removeLayer = function (layer) {
    var index = this.layers.indexOf(layer);
    if (index != -1) {
      this.layers.splice(index, 1);
    }
  };

  ns.Piskel.prototype.removeLayerAt = function (index) {
    this.layers.splice(index, 1);
  };

})();