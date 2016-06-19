(function () {
  var ns = $.namespace('pskl.model');

  /**
   * @constructor
   * @param {Number} width
   * @param {Number} height
   * @param {String} name
   * @param {String} description
   */
  ns.Piskel = function (width, height, descriptor) {
    if (width && height && descriptor) {
      /** @type {Array} */
      this.planes = [];

      /** @type {Number} */
      this.width = width;

      /** @type {Number} */
      this.height = height;

      this.descriptor = descriptor;

      /** @type {String} */
      this.savePath = null;

    } else {
      throw 'Missing arguments in Piskel constructor : ' + Array.prototype
        .join.call(arguments, ',');
    }
  };

  /**
   * Create a piskel instance from an existing set of (non empty) layers
   * Layers should all be synchronized : same number of frames, same dimensions
   * @param  {Array<pskl.model.Layer>} layers
   * @return {pskl.model.Piskel}
   */
  ns.Piskel.fromLayers = function (layers, descriptor) {
    var piskel = null;
    var plane = new pskl.model.Plane('Plane 1');
    if (layers.length > 0 && layers[0].size() > 0) {
      var sampleFrame = layers[0].getFrameAt(0);
      piskel = new pskl.model.Piskel(sampleFrame.getWidth(), sampleFrame.getHeight(), descriptor);
      layers.forEach(plane.addLayer.bind(plane));
    } else {
      throw 'Piskel.fromLayers expects array of non empty pskl.model.Layer' +
         'as first argument';
    }
    piskel.addPlane(plane);
    return piskel;
  };

  /** If there are more than one plane, the piskel is set as multi-plane. */
  ns.Piskel.prototype.checkMultiPlane_ = function () {
    var multiPlane = (this.getPlanes().length != 1);

    if (this.getDescriptor.isMultiPlane !== multiPlane) {
      //TODO(thejohncrafter) Inform user through a custom dialog service ?
      $.publish(Events.MULTIPLANE_CHANGED, multiPlane);
    }

    this.getDescriptor().isMultiPlane = multiPlane;
  };

  ns.Piskel.prototype.getPlanes = function () {
    return this.planes;
  };

  ns.Piskel.prototype.addPlane = function (plane) {
    this.planes.push(plane);
    this.checkMultiPlane_();
  };

  ns.Piskel.prototype.getPlanesByName = function (name) {
    return this.planes.filter(function (p) {
      return p.getName() == name;
    });
  };

  ns.Piskel.prototype.getPlaneAt = function (index) {
    return this.planes[index];
  };

  ns.Piskel.prototype.movePlaneUp = function (plane) {
    var index = this.planes.indexOf(plane);
    if (index > -1 && index < this.planes.length - 1) {
      this.planes[index] = this.planes[index + 1];
      this.planes[index + 1] = plane;
    }
  };

  ns.Piskel.prototype.movePlaneDown = function (plane) {
    var index = this.planes.indexOf(plane);
    if (index > 0) {
      this.planes[index] = this.planes[index - 1];
      this.planes[index - 1] = plane;
    }
  };

  ns.Piskel.prototype.removePlane = function (plane) {
    var index = this.planes.indexOf(plane);
    if (index != -1) {
      this.planes.splice(index, 1);
    }
    this.checkMultiPlane_();
  };

  ns.Piskel.prototype.removePlaneAt = function (index) {
    this.planes.splice(index, 1);
  };

  ns.Piskel.prototype.addPlaneAt = function (plane, index) {
    this.planes.splice(index, 0, plane);
    this.checkMultiPlane_();
  };

  ns.Piskel.prototype.getHeight = function () {
    return this.height;
  };

  ns.Piskel.prototype.getWidth = function () {
    return this.width;
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
    return this.planes.map(function (plane) {
      return plane.getHash();
    }).join('-');
  };

})();
