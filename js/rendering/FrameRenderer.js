(function () {
	var ns = $.namespace("pskl.rendering");
	ns.FrameRenderer = function () {};

	ns.FrameRenderer.prototype.render = function (frame, canvas, dpi) {
		var color;
		for(var col = 0, num_col = frame.length; col < num_col; col++) {
			for(var row = 0, num_row = frame[col].length; row < num_row; row++) {
				color = frame[col][row];
				this.drawPixelInCanvas(col, row, canvas, color, dpi);
			}
		}
	};

	ns.FrameRenderer.prototype.drawPixelInCanvas = function () {
		var context = canvas.getContext('2d');
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

	} 

})();