(function () {
	var ns = $.namespace("pskl.controller");
	ns.DrawingController = function (frame, container, dpi) {
		this.dpi = dpi;

		// Public
		this.frame = frame;
		this.overlay = pskl.model.Frame.createEmptyFromFrame(frame);

		// Private
		this.container = container;
		this.mainCanvas = this.createMainCanvas();
		this.overlayCanvas = this.createOverlayCanvas();
		this.renderer = new pskl.rendering.FrameRenderer();
	};

	ns.DrawingController.prototype.renderFrame = function () {
		this.renderer.render(this.frame, this.mainCanvas, this.dpi);
	};

	ns.DrawingController.prototype.renderFramePixel = function (col, row) {
		this.renderer.drawPixel(col, row, this.frame, this.mainCanvas, this.dpi);
	};

	ns.DrawingController.prototype.renderOverlay = function () {
		this.renderer.render(this.overlay, this.overlayCanvas, this.dpi);
	};

	ns.DrawingController.prototype.clearOverlay = function () {
		this.overlay = pskl.model.Frame.createEmptyFromFrame(this.frame);
		this.overlayCanvas.getContext("2d").clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
	};

	ns.DrawingController.prototype.createMainCanvas = function () {
		var mainCanvas = this.createCanvas();
		mainCanvas.className = "canvas-main";
		this.container.appendChild(mainCanvas);
		return mainCanvas;
	};

	// For some tools, we need a fake canvas that overlay the drawing canvas. These tools are
	// generally 'drap and release' based tools (stroke, selection, etc) and the fake canvas
	// will help to visualize the tool interaction (without modifying the canvas).
	ns.DrawingController.prototype.createOverlayCanvas = function () {
		var overlayCanvas = this.createCanvas();
		overlayCanvas.className = "canvas-overlay";
		this.container.appendChild(overlayCanvas);
		return overlayCanvas;
	};

	// For some tools, we need a fake canvas that overlay the drawing canvas. These tools are
	// generally 'drap and release' based tools (stroke, selection, etc) and the fake canvas
	// will help to visualize the tool interaction (without modifying the canvas).
	ns.DrawingController.prototype.createCanvas = function () {
		var width = this.frame.getWidth(),
			height = this.frame.getHeight();

		var canvas = document.createElement("canvas");
		canvas.setAttribute("width", width * this.dpi);
		canvas.setAttribute("height", height * this.dpi);
		
		return canvas;
	};
})();