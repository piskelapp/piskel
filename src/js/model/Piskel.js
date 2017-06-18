(function () {
  var ns = $.namespace('pskl.model');

  /**
   * @constructor
   * @param {Number} width
   * @param {Number} height
   * @param {String} name
   * @param {String} description
   */
  ns.Piskel = function (width, height, fps, descriptor) {
    if (width && height && descriptor) {
      this.layers = [];
      this.width = width;
      this.height = height;
      this.descriptor = descriptor;
      this.savePath = null;
      this.fps = fps;
    } else {
      throw 'Missing arguments in Piskel constructor : ' + Array.prototype.join.call(arguments, ',');
    }
  };

  /**
   * Create a piskel instance from an existing set of (non empty) layers
   * Layers should all be synchronized : same number of frames, same dimensions
   * @param  {Array<pskl.model.Layer>} layers
   * @return {pskl.model.Piskel}
   */
  ns.Piskel.fromLayers = function (layers, fps, descriptor) {
    var piskel = null;
    if (layers.length > 0 && layers[0].size() > 0) {
      var sampleFrame = layers[0].getFrameAt(0);
      piskel = new pskl.model.Piskel(sampleFrame.getWidth(), sampleFrame.getHeight(), fps, descriptor);
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

  ns.Piskel.prototype.getFPS = function () {
    return this.fps;
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

  ns.Piskel.prototype.getFrameCount = function () {
    return this.getLayerAt(0).size();
  };

  ns.Piskel.prototype.addLayer = function (layer) {
    this.layers.push(layer);
  };

  ns.Piskel.prototype.addLayerAt = function (layer, index) {
    this.layers.splice(index, 0, layer);
  };

  ns.Piskel.prototype.moveLayerUp = function (layer, toTop) {
    var index = this.layers.indexOf(layer);
    var toIndex = toTop ? this.layers.length - 1 : index + 1;
    this.moveLayer_(index, toIndex);
  };

  ns.Piskel.prototype.moveLayerDown = function (layer, toBottom) {
    var index = this.layers.indexOf(layer);
    var toIndex = toBottom ? 0 : index - 1;
    this.moveLayer_(index, toIndex);
  };

  /**
   * Move the layer at the provided index to the provided toIndex.
   */
  ns.Piskel.prototype.moveLayer_ = function (fromIndex, toIndex) {
    if (fromIndex == -1 || toIndex == -1 || fromIndex == toIndex) {
      return;
    }
    toIndex = pskl.utils.Math.minmax(toIndex, 0, this.layers.length - 1);
    var layer = this.layers.splice(fromIndex, 1)[0];
    this.layers.splice(toIndex, 0, layer);
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

  ns.Piskel.prototype.getDescriptor = function () {
    return this.descriptor;
  };

  ns.Piskel.prototype.setDescriptor = function (descriptor) {
    this.descriptor = descriptor;
    $.publish(Events.PISKEL_DESCRIPTOR_UPDATED);
  };

  ns.Piskel.prototype.setName = function (name) {
    this.descriptor.name = name;
    $.publish(Events.PISKEL_DESCRIPTOR_UPDATED);
  };

  ns.Piskel.prototype.getHash = function () {
    return this.layers.map(function (layer) {
      return layer.getHash();
    }).join('-');
  };

})();
