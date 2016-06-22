(function () {
  var ns = $.namespace('pskl.model');

  ns.Plane = function (name) {
    if (!name) {
      throw 'Invalid arguments in Plane constructor : \'name\' is mandatory';
    } else {
      this.name = name;
      this.layers = [];
      this.offset = 0;
    }
  };

  /**
   * Create a Plane instance from an already existing set a Layers
   * @static
   * @param  {String} name plane's name
   * @param  {Array<pskl.model.Layer>} layers should all have the same dimensions
   * @return {pskl.model.Plane}
   */
  ns.Plane.fromLayers = function (name, layers) {
    var plane = new ns.Plane(name);
    layers.forEach(plane.addLayer.bind(plane));
    return plane;
  };

  ns.Plane.prototype.getName = function () {
    return this.name;
  };

  ns.Plane.prototype.setName = function (name) {
    this.name = name;
  };

  ns.Plane.prototype.getOffset = function () {
    return this.offset;
  };

  ns.Plane.prototype.setOffset = function (offset) {
    if (offset === null || isNaN(offset)) {
      return;
    }
    this.offset = offset;
  };

  ns.Plane.prototype.getLayers = function () {
    return this.layers;
  };

  ns.Plane.prototype.getLayerAt = function (index) {
    return this.layers[index];
  };

  ns.Plane.prototype.addLayer = function (layer) {
    this.layers.push(layer);
  };

  ns.Plane.prototype.addLayerAt = function (layer, index) {
    this.layers.splice(index, 0, layer);
  };

  ns.Plane.prototype.removeLayer = function (layer) {
    var index = this.layers.indexOf(layer);
    this.removeLayerAt(index);
  };

  ns.Plane.prototype.removeLayerAt = function (index) {
    if (this.layers[index]) {
      this.layers.splice(index, 1);
    } else {
      console.error('Invalid index in removeLayerAt : %s (size : %s)', index, this.size());
    }
  };

  ns.Plane.prototype.moveLayer = function (fromIndex, toIndex) {
    var layer = this.layers.splice(fromIndex, 1)[0];
    this.layers.splice(toIndex, 0, layer);
  };

  ns.Plane.prototype.swapLayersAt = function (fromIndex, toIndex) {
    var fromLayer = this.layers[fromIndex];
    var toLayer = this.layers[toIndex];
    if (fromLayer && toLayer) {
      this.layers[toIndex] = fromLayer;
      this.layers[fromIndex] = toLayer;
    } else {
      console.error('Layer not found in moveLayerAt (from %s, to %s)', fromIndex, toIndex);
    }
  };

  ns.Plane.prototype.duplicateLayer = function (layer) {
    var index = this.layers.indexOf(layer);
    this.duplicateLayerAt(index);
  };

  ns.Plane.prototype.duplicateLayerAt = function (index) {
    var layer = this.layers[index];
    if (layer) {
      var clone = layer.clone();
      this.addLayerAt(clone, index);
    } else {
      console.error('Layer not found in duplicateLayerAt (at %s)', index);
    }
  };

  ns.Plane.prototype.getLayersByName = function (name) {
    return this.layers.filter(function (l) {
      return l.getName() == name;
    });
  };

  ns.Plane.prototype.moveLayerUp = function (layer) {
    var index = this.layers.indexOf(layer);
    if (index > -1 && index < this.layers.length - 1) {
      this.layers[index] = this.layers[index + 1];
      this.layers[index + 1] = layer;
    }
  };

  ns.Plane.prototype.moveLayerDown = function (layer) {
    var index = this.layers.indexOf(layer);
    if (index > 0) {
      this.layers[index] = this.layers[index - 1];
      this.layers[index - 1] = layer;
    }
  };

  ns.Plane.prototype.size = function () {
    return this.layers.length;
  };

  ns.Plane.prototype.getFrameCount = function () {
    return this.getLayerAt(0).size();
  };

  ns.Plane.prototype.hasLayerAt = function (index) {
    return !!this.getLayerAt(index);
  };

  ns.Plane.prototype.getHash = function () {
    return this.offset + ':' + this.layers.map(function (layer) {
      return layer.getHash();
    }).join('-');
  };
})();
