/*
 * @provide pskl.drawingtools.BaseTool
 *
 * @require pskl.utils
 */
(function() {
	var ns = $.namespace("pskl.drawingtools");

	ns.BaseTool = function() {};

	ns.BaseTool.prototype.applyToolAt = function(col, row, frame, color, canvas, dpi) {};
	
	ns.BaseTool.prototype.moveToolAt = function(col, row, frame, color, canvas, dpi) {};

	ns.BaseTool.prototype.releaseToolAt = function(col, row, frame, color, canvas, dpi) {};

	// TODO: Remove that when we have the centralized redraw loop
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

	// TODO: Remove that when we have the centralized redraw loop
	ns.BaseTool.prototype.drawFrameInCanvas = function (frame, canvas, dpi) {
	  var color;
	  for(var col = 0, num_col = frame.length; col < num_col; col++) {
	    for(var row = 0, num_row = frame[col].length; row < num_row; row++) {
	      color = pskl.utils.normalizeColor(frame[col][row]);
	      this.drawPixelInCanvas(col, row,canvas, color, dpi);
	    }
	  }
	};

	// For some tools, we need a fake canvas that overlay the drawing canvas. These tools are
	// generally 'drap and release' based tools (stroke, selection, etc) and the fake canvas
	// will help to visualize the tool interaction (without modifying the canvas).
	ns.BaseTool.prototype.createCanvasOverlay = function (canvas) {
		var overlayCanvas = document.createElement("canvas");
		overlayCanvas.className = "canvas-overlay";
		overlayCanvas.setAttribute("width", canvas.width);
		overlayCanvas.setAttribute("height", canvas.height);

		canvas.parentNode.appendChild(overlayCanvas);
		return overlayCanvas;
	};

	ns.BaseTool.prototype.removeCanvasOverlays = function () {
		$(".canvas-overlay").remove();
	};

	/**
	 * Bresenham line algorihtm: Get an array of pixels from
	 * start and end coordinates.
	 *
	 * http://en.wikipedia.org/wiki/Bresenham's_line_algorithm
	 * http://stackoverflow.com/questions/4672279/bresenham-algorithm-in-javascript
	 *
	 * @private
	 */
	ns.BaseTool.prototype.getLinePixels_ = function(x0, x1, y0, y1) {
		
		var pixels = [];
		var dx = Math.abs(x1-x0);
	   	var dy = Math.abs(y1-y0);
	   	var sx = (x0 < x1) ? 1 : -1;
	   	var sy = (y0 < y1) ? 1 : -1;
	   	var err = dx-dy;

	   	while(true){

	    	// Do what you need to for this
	    	pixels.push({"col": x0, "row": y0});

		    if ((x0==x1) && (y0==y1)) break;
		    var e2 = 2*err;
		    if (e2>-dy){
		    	err -= dy;
		    	x0  += sx;
		    }
		    if (e2 < dx) {
		    	err += dx;
		    	y0  += sy;
		    }
	    }
	    return pixels;
     };
})();
