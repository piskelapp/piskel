/*
 * @provide pskl.drawingtools.SimplePen
 *
 * @require pskl.utils
 */
(function() {
	var ns = $.namespace("pskl.drawingtools");

	ns.Stroke = function() {
		this.toolId = "tool-stroke"
		
		// Stroke's first point coordinates (set in applyToolAt)
		this.startCol = null;
		this.startRow = null;
		// Stroke's second point coordinates (changing dynamically in moveToolAt)
		this.endCol = null;
		this.endRow = null;
		
		this.canvasOverlay = null;
	};

	pskl.utils.inherit(ns.Stroke, ns.BaseTool);
	
	/**
	 * @override
	 */
	ns.Stroke.prototype.applyToolAt = function(col, row, frame, color, canvas, dpi) {
		this.startCol = col;
		this.startRow = row;
		
		// When drawing a stroke we don't change the model instantly, since the
		// user can move his cursor to change the stroke direction and length
		// dynamically. Instead we draw the (preview) stroke in a fake canvas that
		// overlay the drawing canvas.
		// We wait for the releaseToolAt callback to impact both the
		// frame model and canvas rendering.

		// The fake canvas where we will draw the preview of the stroke:
		this.canvasOverlay = this.createCanvasOverlay(canvas);
		// Drawing the first point of the stroke in the fake overlay canvas:
		this.drawPixelInCanvas(col, row, this.canvasOverlay, color, dpi);
	};

	ns.Stroke.prototype.moveToolAt = function(col, row, frame, color, canvas, dpi) {
		this.endCol = col;
		this.endRow = row;
		// When the user moussemove (before releasing), we dynamically compute the 
		// pixel to draw the line and draw this line in the overlay canvas:
		var strokePoints = this.getLinePixels_(this.startCol, this.endCol, this.startRow, this.endRow);

		// Clean overlay canvas:
		this.canvasOverlay.getContext("2d").clearRect(
			0, 0, this.canvasOverlay.width, this.canvasOverlay.height);
		
		// Drawing current stroke:
		for(var i = 0; i< strokePoints.length; i++) {			
			this.drawPixelInCanvas(strokePoints[i].col, strokePoints[i].row, this.canvasOverlay, color, dpi);
		}
	};

	/**
	 * @override
	 */
	ns.Stroke.prototype.releaseToolAt = function(col, row, frame, color, canvas, dpi) {
		this.endCol = col;
		this.endRow = row;
		
		// If the stroke tool is released outside of the canvas, we cancel the stroke: 
		if(col < 0 || row < 0 || col > frame.length || row > frame[0].length) {
			this.removeCanvasOverlays();
			return;
		}

		// The user released the tool to draw a line. We will compute the pixel coordinate, impact
		// the model and draw them in the drawing canvas (not the fake overlay anymore)
		var strokePoints = this.getLinePixels_(this.startCol, this.endCol, this.startRow, this.endRow);

		for(var i = 0; i< strokePoints.length; i++) {
			// Change model:
			frame[strokePoints[i].col][strokePoints[i].row] = color;
			
			// Draw in canvas:
			// TODO: Remove that when we have the centralized redraw loop
			this.drawPixelInCanvas(strokePoints[i].col, strokePoints[i].row, canvas, color, dpi);		
		}

		// For now, we are done with the stroke tool and don't need an overlay anymore:
		this.removeCanvasOverlays();
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
	ns.Stroke.prototype.getLinePixels_ = function(x0, x1, y0, y1) {
		
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
