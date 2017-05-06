(function () {
  var ns = $.namespace('pskl.widgets');

  var WIDGET_MARKUP =
    '<div class="frame-viewer"></div>' +
    '<div class="frame-nav">' +
      '<button class="button frame-nav-first">&lt;&lt;</button>' +
      '<button class="button frame-nav-previous">&lt;</button>' +
      '<input class="textfield frame-nav-input" type="text">' +
      '<button class="button frame-nav-next">&gt;</button>' +
      '<button class="button frame-nav-last">&gt;&gt;</button>' +
    '</div>';

  /**
   * The frame picker widget displays a a simple UI to view the frames of a piskel.
   * UI controls allow the user to browser through the frames
   * @param {Piskel} piskel
   *        The piskel instance for which we want to preview frames.
   * @param {Node} container
   *        Node in which the widget should be inserted.
   */
  ns.FramePicker = function (piskel, container) {
    this.piskel = piskel;
    this.container = container;
    this.firstFrameIndex = 1;

    // Create internal wrapper that will contain the widget.
    this.wrapper = document.createElement('div');
    this.wrapper.innerHTML = WIDGET_MARKUP;
    this.wrapper.classList.add('frame-picker-wrapper');

    this.frameViewer = this.wrapper.querySelector('.frame-viewer');
    this.firstButton = this.wrapper.querySelector('.frame-nav-first');
    this.previousButton = this.wrapper.querySelector('.frame-nav-previous');
    this.nextButton = this.wrapper.querySelector('.frame-nav-next');
    this.lastButton = this.wrapper.querySelector('.frame-nav-last');
    this.input = this.wrapper.querySelector('.frame-nav-input');
  };

  ns.FramePicker.prototype.init = function () {
    // Add widget to its container
    this.container.appendChild(this.wrapper);

    // Attach event listeners
    this.addEventListener(this.firstButton, 'click', this.onFirstClicked_);
    this.addEventListener(this.previousButton, 'click', this.onPreviousClicked_);
    this.addEventListener(this.nextButton, 'click', this.onNextClicked_);
    this.addEventListener(this.lastButton, 'click', this.onLastClicked_);
    this.addEventListener(this.input, 'change', this.onInputChange_);

    // Select the first frame
    this.setFrameIndex(1);
  };

  ns.FramePicker.prototype.setFirstFrameIndex = function (index) {
    this.firstFrameIndex = index;
    // Set the current frame index once again to normalize and update the UI if needed.
    this.setFrameIndex(this.currentFrameIndex);
  };

  ns.FramePicker.prototype.destroy = function () {
    if (this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }

    pskl.utils.Event.removeAllEventListeners(this);
  };

  ns.FramePicker.prototype.onFirstClicked_ = function () {
    this.setFrameIndex(this.firstFrameIndex);
  };

  ns.FramePicker.prototype.onPreviousClicked_ = function () {
    this.setFrameIndex(this.currentFrameIndex - 1);
  };

  ns.FramePicker.prototype.onNextClicked_ = function () {
    this.setFrameIndex(this.currentFrameIndex + 1);
  };

  ns.FramePicker.prototype.onLastClicked_ = function () {
    this.setFrameIndex(this.piskel.getFrameCount());
  };

  ns.FramePicker.prototype.onInputChange_ = function () {
    var index = parseInt(this.input.value, 10);
    if (isNaN(index)) {
      this.input.value = 1;
      return;
    }

    index = Math.max(this.firstFrameIndex, index);
    index = Math.min(this.getFrameCount_(), index);

    if (index !== this.currentFrameIndex) {
      this.setFrameIndex(index);
    }
  };

  ns.FramePicker.prototype.getFrameCount_ = function () {
    return this.piskel.getLayerAt(0).getFrames().length;
  };

  ns.FramePicker.prototype.addEventListener = function (el, type, callback) {
    pskl.utils.Event.addEventListener(el, type, callback, this);
  };

  ns.FramePicker.prototype.getFrameIndex = function () {
    return this.currentFrameIndex;
  };

  ns.FramePicker.prototype.setFrameIndex = function (frameIndex) {
    frameIndex = Math.max(this.firstFrameIndex, frameIndex);
    frameIndex = Math.min(this.getFrameCount_(), frameIndex);

    this.currentFrameIndex = frameIndex;
    this.input.value = frameIndex;

    var image = this.getFrameAsImage_(frameIndex);
    image.classList.add('canvas-background');
    this.frameViewer.innerHTML = '';
    this.frameViewer.appendChild(image);

    var frameCount = this.getFrameCount_();
    this.setEnabled_(this.firstButton, frameIndex !== this.firstFrameIndex);
    this.setEnabled_(this.previousButton, frameIndex !== this.firstFrameIndex);
    this.setEnabled_(this.nextButton, frameIndex !== frameCount);
    this.setEnabled_(this.lastButton, frameIndex !== frameCount);

    if (frameIndex === 0) {
      this.previousButton.setAttribute('disabled', true);
      this.firstButton.setAttribute('disabled', true);
    }
  };

  ns.FramePicker.prototype.getFrameAsImage_ = function (frameIndex) {
    if (frameIndex === 0) {
      return new Image();
    }

    var frame = pskl.utils.LayerUtils.mergeFrameAt(this.piskel.getLayers(), frameIndex - 1);
    var zoom = this.getZoomLevel_();
    return pskl.utils.FrameUtils.toImage(frame, zoom);
  };

  ns.FramePicker.prototype.getZoomLevel_ = function () {
    var viewerWidth = this.frameViewer.offsetWidth;
    var viewerHeight = this.frameViewer.offsetHeight;
    var wZoom = viewerWidth / this.piskel.width;
    var hZoom = viewerHeight / this.piskel.height;
    return Math.min(hZoom, wZoom);
  };

  /**
   * DOM helper to enable / disable as DOM element.
   * @param {Node} el
   *        The element to enable / disable.
   * @param {Boolean} enabled
   *        Should the element be disabled or enabled.
   */
  ns.FramePicker.prototype.setEnabled_ = function (el, enabled) {
    if (enabled) {
      el.removeAttribute('disabled');
    } else {
      el.setAttribute('disabled', true);
    }
  };
})();
