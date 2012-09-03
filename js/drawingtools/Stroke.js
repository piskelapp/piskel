/*
 * @provide pskl.drawingtools.Stroke
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

			if(color == Constants.TRANSPARENT_COLOR) {
				// When mousemoving the stroke tool, we draw in the canvas overlay above the drawing canvas.
				// If the stroke color is transparent, we won't be
				// able to see it during the movement.
				// We set it to a semi-opaque white during the tool mousemove allowing to see colors below the stroke.
				// When the stroke tool will be released, It will draw a transparent stroke, 
				// eg deleting the equivalent of a stroke.		
				color = "rgba(255, 255, 255, 0.6)";
			}			
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
		// TODO: Mutualize this check in common method
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

		// TODO: Create a afterRelease event hook or out that deep in the model
		$.publish(Events.FRAMESHEET_UPDATED);     
	};

})();
