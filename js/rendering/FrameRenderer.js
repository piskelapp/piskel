(function () {
	var ns = $.namespace("pskl.rendering");

	this.dpi = null;

	ns.FrameRenderer = function (dpi) {
		if(dpi == undefined || isNaN(dpi)) {
			throw "Bad FrameRenderer initialization. <dpi> not well defined.";
		}

		this.dpi = dpi;
	};

	ns.FrameRenderer.prototype.render = function (frame, canvas) {
		for(var col = 0, width = frame.getWidth(); col < width; col++) {
			for(var row = 0, height = frame.getHeight(); row < height; row++) {
				this.drawPixel(col, row, frame, canvas, this.dpi);
			}
		}
	};

	ns.FrameRenderer.prototype.drawPixel = function (col, row, frame, canvas) {
		var context = canvas.getContext('2d');
		var color = frame.getPixel(col, row);
		if(color == Constants.TRANSPARENT_COLOR) {
			context.clearRect(col * this.dpi, row * this.dpi, this.dpi, this.dpi);   
		} 
		else {
			if(color != Constants.SELECTION_TRANSPARENT_COLOR) {
				// TODO(vincz): Found a better design to update the palette, it's called too frequently.
				$.publish(Events.COLOR_USED, [color]);
			}
			context.fillStyle = color;
			context.fillRect(col * this.dpi, row * this.dpi, this.dpi, this.dpi);
		}
	};
})();