(function () {
	var ns = $.namespace("pskl.controller");
	ns.AnimatedPreviewController = function (framesheet, container, dpi) {
		this.framesheet = framesheet;
		this.container = container;
		this.animIndex = 0;

		this.fps = parseInt($("#preview-fps")[0].value, 10);

		var renderingOptions = {
			"dpi": dpi
		};
		this.renderer = new pskl.rendering.FrameRenderer(this.container, renderingOptions);
	};

	ns.AnimatedPreviewController.prototype.init = function () {
		this.initDom();

		this.renderer.init(this.framesheet.getFrameByIndex(this.animIndex));

		this.startAnimationTimer();
	};

	ns.AnimatedPreviewController.prototype.initDom = function () {
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
   		this.renderer.render(this.framesheet.getFrameByIndex(this.animIndex));
		this.animIndex++;
		this.startAnimationTimer();
    };

})();