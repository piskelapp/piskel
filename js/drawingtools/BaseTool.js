/*
 * @provide pskl.drawingtools.BaseTool
 *
 * @require pskl.utils
 */
(function() {
	var ns = $.namespace("pskl.drawingtools");

	ns.BaseTool = function() {};

	ns.BaseTool.prototype.applyToolOnFrameAt = function(col, row, frame, color) {};
	
	ns.BaseTool.prototype.applyToolOnCanvasAt = function(col, row, canvas, color, dpi) {};
	
	ns.BaseTool.prototype.releaseToolAt = function() {};

	ns.BaseTool.prototype.drawPixelInCanvas = function (col, row, canvas, color, dpi) {
		var context = canvas.getContext('2d');
		if(color == undefined || color == Constants.TRANSPARENT_COLOR) {
			context.clearRect(col * dpi, row * dpi, dpi, dpi);   
		} 
		else {
			// TODO(vincz): Remove this global access to piskel when Palette component is created.
			piskel.addColorToPalette(color);
			context.fillStyle = color;
			context.fillRect(col * dpi, row * dpi, dpi, dpi);
		}
	};

	ns.BaseTool.prototype.drawFrameInCanvas = function (frame, canvas, dpi) {
	  var color;
	  for(var col = 0, num_col = frame.length; col < num_col; col++) {
	    for(var row = 0, num_row = frame[col].length; row < num_row; row++) {
	      color = pskl.utils.normalizeColor(frame[col][row]);
	      this.drawPixelInCanvas(col, row,canvas, color, dpi);
	    }
	  }
	};
})();
