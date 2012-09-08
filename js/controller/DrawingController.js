(function () {
	var ns = $.namespace("pskl.controller");
	ns.DrawingController = function (frame, container, dpi) {
		this.dpi = dpi;

		var renderingOptions = {
			"dpi": dpi,
			"displayGrid": true // Retrieve from localsotrage config 
		}

		// Public
		this.frame = frame;
		this.overlayFrame = pskl.model.Frame.createEmptyFromFrame(frame); // Type is frame

		// Private
		this.container = container;
		this.renderer = new pskl.rendering.FrameRenderer(this.container, renderingOptions, "drawing-canvas");
		this.overlayRenderer = new pskl.rendering.FrameRenderer(this.container, renderingOptions, "canvas-overlay");
		
		this.renderer.init(this.frame);
		this.overlayRenderer.init(this.frame);
	};

	ns.DrawingController.prototype.updateDPI = function (newDPI) {
		this.renderer.updateDPI(newDPI);
		this.overlayRenderer.updateDPI(newDPI);

		this.renderer.render(this.frame);
		this.overlayRenderer.render(this.frame);
	};

	ns.DrawingController.prototype.renderFrame = function () {
		this.renderer.render(this.frame);
	};

	ns.DrawingController.prototype.renderFramePixel = function (col, row) {
		this.renderer.drawPixel(col, row, this.frame);
	};

	ns.DrawingController.prototype.renderOverlay = function () {
		this.overlayRenderer.render(this.overlayFrame);
	};

	ns.DrawingController.prototype.clearOverlay = function () {
		this.overlayFrame = pskl.model.Frame.createEmptyFromFrame(this.frame);
		this.overlayRenderer.clear();
	};
})();