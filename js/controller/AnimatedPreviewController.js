(function () {
	var ns = $.namespace("pskl.controller");
	ns.AnimatedPreviewController = function (framesheet, container, dpi) {
		this.dpi = dpi;
		this.framesheet = framesheet;
		this.container = container;
		this.animIndex = 0;

		this.fps = parseInt($("#preview-fps")[0].value, 10);

		this.renderer = new pskl.rendering.FrameRenderer();
	};

	ns.AnimatedPreviewController.prototype.init = function () {
		this.initDom();
		this.startAnimationTimer();
	};

	ns.AnimatedPreviewController.prototype.initDom = function () {
		var frame = this.framesheet.getFrameByIndex(0);
		var height = frame.getHeight() * this.dpi,
			width = frame.getWidth() * this.dpi;

		previewCanvas = document.createElement('canvas');
		previewCanvas.className = 'canvas';

		this.container.setAttribute('style', 'width:' + width + 'px; height:' + height + 'px;');
		previewCanvas.setAttribute('width', width);
		previewCanvas.setAttribute('height', height);

		this.container.appendChild(previewCanvas);
		this.previewCanvas = previewCanvas;

		$("#preview-fps")[0].addEventListener('change', this.onFPSSliderChange.bind(this));
	};

   	ns.AnimatedPreviewController.prototype.startAnimationTimer = function () {
   		this.stopAnimationTimer();
		this.animationTimer = window.setTimeout(this.refreshAnimatedPreview.bind(this), 1000/this.fps);
    };

   	ns.AnimatedPreviewController.prototype.stopAnimationTimer = function () {
   		if (this.animationTimer) {
   			window.clearInterval(this.animationTimer);
   			this.animationTimer = null;
   		}
    };

    ns.AnimatedPreviewController.prototype.onFPSSliderChange = function(evt) {
		this.fps = parseInt($("#preview-fps")[0].value, 10);
	};

   	ns.AnimatedPreviewController.prototype.refreshAnimatedPreview = function () {
   		if (!this.framesheet.hasFrameAtIndex(this.animIndex)) {
   			this.animIndex = 0;
   		}
		
		this.renderer.render(this.framesheet.getFrameByIndex(this.animIndex), this.previewCanvas, this.dpi);
		this.animIndex++;
		this.startAnimationTimer();
    };

})();