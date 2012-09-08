(function () {
	var ns = $.namespace("pskl.controller");
	ns.AnimatedPreviewController = function (framesheet, container, dpi) {
		this.framesheet = framesheet;
		this.container = container;

		this.elapsedTime = 0;
		this.currentIndex = 0;

		this.fps = parseInt($("#preview-fps")[0].value, 10);
		this.deltaTime = 0;
		this.previousTime = 0;
		var renderingOptions = {
			"dpi": dpi
		};
		this.renderer = new pskl.rendering.FrameRenderer(this.container, renderingOptions);
	};

	ns.AnimatedPreviewController.prototype.init = function () {
		$("#preview-fps")[0].addEventListener('change', this.onFPSSliderChange.bind(this));
	};

    ns.AnimatedPreviewController.prototype.onFPSSliderChange = function(evt) {
		this.fps = parseInt($("#preview-fps")[0].value, 10);
	};

   	ns.AnimatedPreviewController.prototype.render = function (delta) {
   		this.elapsedTime += delta;
   		var index = Math.floor(this.elapsedTime / (1000/this.fps));
   		if (index != this.currentIndex) {
   			this.currentIndex = index;
   			if (!this.framesheet.hasFrameAtIndex(this.currentIndex)) {
	   			this.currentIndex = 0;
	   			this.elapsedTime = 0;
	   		}
	   		this.renderer.render(this.framesheet.getFrameByIndex(this.currentIndex));
   		}
    };

})();