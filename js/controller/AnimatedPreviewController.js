(function () {
	var ns = $.namespace("pskl.controller");
	ns.AnimatedPreviewController = function (framesheet, container, dpi) {
		this.framesheet = framesheet;
		this.container = container;
		this.animIndex = 0;

		this.fps = parseInt($("#preview-fps")[0].value, 10);
		this.deltaTime = 0;
		this.previousTime = 0;
		var renderingOptions = {
			"dpi": dpi
		};
		this.renderer = new pskl.rendering.FrameRenderer(this.container, renderingOptions);
	};

	ns.AnimatedPreviewController.prototype.init = function () {
		this.initDom();
		this.renderer.init(this.framesheet.getFrameByIndex(this.animIndex));
	};

	ns.AnimatedPreviewController.prototype.initDom = function () {
		$("#preview-fps")[0].addEventListener('change', this.onFPSSliderChange.bind(this));
	};

    ns.AnimatedPreviewController.prototype.onFPSSliderChange = function(evt) {
		this.fps = parseInt($("#preview-fps")[0].value, 10);
	};

   	ns.AnimatedPreviewController.prototype.render = function () {
   		if (!this.framesheet.hasFrameAtIndex(this.animIndex)) {
   			this.animIndex = 0;
   		}
   		this.renderer.render(this.framesheet.getFrameByIndex(this.animIndex));
		this.animIndex++;
    };

})();