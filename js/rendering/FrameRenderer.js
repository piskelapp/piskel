(function () {
	var ns = $.namespace("pskl.rendering");
	ns.FrameRenderer = function () {};

	ns.FrameRenderer.prototype.render = function (frame, canvas, dpi) {
		for(var col = 0, width = frame.getWidth(); col < width; col++) {
			for(var row = 0, height = frame.getHeight(); row < height; row++) {
				this.drawPixel(col, row, frame, canvas, dpi);
			}
		}
	};

	ns.FrameRenderer.prototype.drawPixel = function (col, row, frame, canvas, dpi) {
		var context = canvas.getContext('2d');
		var color = frame.getPixel(col, row);
		if(color == Constants.TRANSPARENT_COLOR) {
			context.clearRect(col * dpi, row * dpi, dpi, dpi);   
		} 
		else {
			if(color != Constants.SELECTION_TRANSPARENT_COLOR) {
				// TODO(vincz): Found a better design to update the palette, it's called too frequently.
				$.publish(Events.COLOR_USED, [color]);
			}
			context.fillStyle = color;
			context.fillRect(col * dpi, row * dpi, dpi, dpi);
		}
	};
})();