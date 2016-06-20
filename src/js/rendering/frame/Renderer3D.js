/* globals THREE:false */
// ^ for jscs ^
(function () {
  var ns = $.namespace('pskl.rendering.frame');

  ns.Renderer3D = function (container, zoom, testMode) {
    this.container = container;
    this.setZoom(zoom);

    var containerEl = container.get(0);
    var containerDocument = containerEl.ownerDocument;

    //NOTE: Renderer & camera's size are set layer in updateSize()
    this.scene_ = new THREE.Scene();
    this.camera_ = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.renderer_ = new THREE.WebGLRenderer({alpha: true, antialias: true});

    this.renderer_.domElement.classList.add('background-image-frame-container');
    containerEl.appendChild(this.renderer_.domElement);

    this.controls_ = new THREE.TrackballControls(this.camera_, containerEl);
    this.controls_.rotateSpeed = 3;
    this.controls_.zoomSpeed = 1;
    this.controls_.panSpeed = 0.8;
    this.controls_.noZoom = false;
    this.controls_.noPan = false;
    this.controls_.staticMoving = true;
    this.controls_.dynamicDampingFactor = 0.3;

    // ugly this-ref
    var _this = this;
    this.controls_.addEventListener('change', function() {
      _this.renderer_.render(_this.scene_, _this.camera_);
    });

    this.planes_ = [];

    this.camera_.position.z = 5;
    this.renderer_.render(this.scene_, this.camera_);

    this.cachedFrameProcessor = new pskl.model.frame.CachedFrameProcessor();
    this.cachedFrameProcessor.setFrameProcessor(this.frameToDataUrl_.bind(this));
    this.preferedOpacity_ = 1;
  };

  // Mocked renderer for test tools
  //TODO(thejohncafter) Mock this class elsewhere in the test code !
  ns.Renderer3D.Mocked = function () {
    return {
      zoom: 0,
      render: Constants.EMPTY_FUNCTION,
      show: Constants.EMPTY_FUNCTION,
      updatePlanes: Constants.EMPTY_FUNCTION,
      getZoom: function () {return this.zoom;},
      setZoom: function (zoom) {this.zoom = zoom;},
      setRepeated: Constants.EMPTY_FUNCTION,
      resetCamera: Constants.EMPTY_FUNCTION,
      updateSize: Constants.EMPTY_FUNCTION
    };
  };

  ns.Renderer3D.prototype.updateSize = function (width, height) {
    this.renderer_.setSize(width, height);
    this.camera_.aspect = width / height;
    this.camera_.updateProjectionMatrix();
  };

  ns.Renderer3D.prototype.updatePlanes = function (planes, width, height) {
    this.planes_.forEach(function (plane) {
      this.scene_.remove(plane);
    }, this);
    this.planes_ = [];
    planes.forEach(function (model) {
      var geometry = new THREE.PlaneGeometry(width / 10, height / 10);
      var material = new THREE.MeshBasicMaterial();
      material.transparent = true;
      material.opacity = 0;
      var plane = new THREE.Mesh(geometry, material);
      plane.position.z = model.getOffset() / 10;
      this.planes_.push(plane);
      this.scene_.add(plane);
    }, this);
  };

  ns.Renderer3D.prototype.updateOpacity = function () {
    this.preferedOpacity_ = pskl.UserSettings.get(pskl.UserSettings.PLANE_PREVIEW) ?
      pskl.UserSettings.get(pskl.UserSettings.PLANE_OPACITY) : 1;
  };

  ns.Renderer3D.prototype.frameToDataUrl_ = function (frame) {
    var canvas;
    if (frame instanceof pskl.model.frame.RenderedFrame) {
      canvas = pskl.utils.ImageResizer.scale(frame.getRenderedFrame(),
        this.zoom);
    } else {
      canvas = pskl.utils.FrameUtils.toImage(frame, this.zoom);
    }
    return canvas.toDataURL('image/png');
  };

  ns.Renderer3D.prototype.render = function (frames, shouldUpdate) {
    // render previous frame
    this.controls_.update();
    this.renderer_.render(this.scene_, this.camera_);

    if (shouldUpdate) {
      frames.forEach(this.renderPlane_.bind(this));
    }
  };

  ns.Renderer3D.prototype.renderPlane_ = function (frame, index) {
    var loader = new THREE.TextureLoader();
    var imageSrc = this.cachedFrameProcessor.get(frame, this.zoom);

    // ugly this-ref
    var _this = this;
    var plane = _this.planes_[index];
    var material = this.planes_[index].material;
    loader.load(imageSrc, function(texture) {
      material.map = texture;
      material.needsUpdate = true;
      material.opacity = _this.preferedOpacity_;
    }, function() {}, function(error) {
      console.error('Error while loading imageSrc !');
      console.error(error);
    });
  };

  ns.Renderer3D.prototype.show = function () {
    if (this.renderer_.domElement) {
      this.renderer_.domElement.style.display = 'block';
    }
  };

  ns.Renderer3D.prototype.setZoom = function (zoom) {
    this.zoom = zoom;
  };

  ns.Renderer3D.prototype.getZoom = function () {
    return this.zoom;
  };

  ns.Renderer3D.prototype.setRepeated = function (repeat) {
    //TODO(thejohncafter): implement !
  };

  ns.Renderer3D.prototype.resetCamera = function () {
    this.controls_.reset();
    this.camera_.position.z = 5;
  };

  ns.Renderer3D.prototype.dispose = function () {
    this.controls_.enabled = false;
  };
})();
