(function () {
  var ns = $.namespace('pskl.controller.preview');

  ns.Preview3D = function (piskelController, container, testModeOn) {
    this.piskelController = piskelController;
    this.container = container;
    this.testModeOn_ = testModeOn;

    this.currentIndex = 0;
    this.renderFlag = true;

    this.prevPlanesData = {};
  };

  ns.Preview3D.prototype.init = function () {
    // check if we are in a test or not.
    if (!this.testModeOn_) {
      this.renderer = new pskl.rendering.frame.Renderer3D(this.container);
    } else {
      //TODO(thejohncrafter) Mock Renderer3D in devtools/init.js
      this.renderer = pskl.rendering.frame.Renderer3D.Mocked();
    }

    this.renderer.show();
    this.currentFrames_ = this.getCurrentFrames_(0);
  };

  ns.Preview3D.prototype.render = function (index, shouldUpdateTextures) {
    if (this.shouldUpdatePlanes_()) {
      this.renderer.updatePlanes(
        this.piskelController.getPlanes(),
        this.piskelController.getWidth(),
        this.piskelController.getHeight()
      );
    }

    if (this.renderFlag || shouldUpdateTextures) {
      this.currentIndex = index;
      this.currentFrames_ = this.getCurrentFrames_(index);
      this.renderFlag = false;
    }

    this.renderer.render(this.currentFrames_, shouldUpdateTextures);
  };

  ns.Preview3D.prototype.getCurrentFrames_ = function (index) {
    return this.piskelController.getPlanes().map(function (plane) {
      return pskl.utils.LayerUtils.mergeFrameAt(plane.getLayers(), index);
    }, this);
  };

  ns.Preview3D.prototype.shouldUpdatePlanes_ = function () {
    var newPlaneData = {
      count: this.piskelController.getPlanes().length,
      width: this.piskelController.getWidth(),
      height: this.piskelController.getHeight(),
      offsetHash: this.piskelController.getPlanes()
        .map(function (p) {return p.getOffset();})
        .join('-')
    };
    var should =
      this.prevPlanesData.count != newPlaneData.count ||
      this.prevPlanesData.width != newPlaneData.width ||
      this.prevPlanesData.height != newPlaneData.height ||
      this.prevPlanesData.offsetHash != newPlaneData.offsetHash;
    this.prevPlanesData = newPlaneData;
    return should;
  };

  ns.Preview3D.prototype.getToolButtons = function () {
    return ['reset-camera-button'];
  };

  ns.Preview3D.prototype.getName = function () {
    return 'Preview3D';
  };

  ns.Preview3D.prototype.setRenderFlag = function (bool) {
    this.renderFlag = bool;
  };

  // Method forwards
  ns.Preview3D.prototype.remove = function () {
    this.renderer.remove();
  };

  ns.Preview3D.prototype.resetCamera = function () {
    this.renderer.resetCamera();
  };

  ns.Preview3D.prototype.updateOpacity = function () {
    this.renderer.updateOpacity();
  };

  ns.Preview3D.prototype.setZoom = function (zoom) {
    this.renderer.setZoom(zoom);
  };

  ns.Preview3D.prototype.setRepeated = function (repeated) {
    this.renderer.setRepeated(repeated);
  };

  ns.Preview3D.prototype.updateSize = function (width, height) {
    this.renderer.updateSize(width, height);
  };
})();
