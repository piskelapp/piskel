/*
 * @provide pskl.drawingtools.SimplePen
 *
 * @require pskl.utils
 */
(function() {
	var ns = $.namespace("pskl.drawingtools");

	ns.SimplePen = function() {
		this.toolId = "tool-pen";
	};

	this.previousCol = null;
	this.previousRow = null;

	pskl.utils.inherit(ns.SimplePen, ns.BaseTool);
	
	/**
	 * @override
	 */
	ns.SimplePen.prototype.applyToolAt = function(col, row, color, drawer) {
		if (drawer.frame.containsPixel(col, row)) {
			this.previousCol = col;
			this.previousRow = row;
		    drawer.frame.setPixel(col, row, color);
		}
	};

	ns.SimplePen.prototype.moveToolAt = function(col, row, color, drawer) {
		
		if((Math.abs(col - this.previousCol) > 1) || (Math.abs(row - this.previousRow) > 1)) {
			// The pen movement is too fast for the mousemove frequency, there is a gap between the
			// current point and the previously drawn one.
			// We fill the gap by calculating missing dots (simple linear interpolation) and draw them.
			var interpolatedPixels = this.getLinePixels_(col, this.previousCol, row, this.previousRow);
			for(var i=0, l=interpolatedPixels.length; i<l; i++) {
				this.applyToolAt(interpolatedPixels[i].col, interpolatedPixels[i].row, color, drawer);
			}
		}
		else {
			this.applyToolAt(col, row, color, drawer);
		}

		this.previousCol = col;
		this.previousRow = row;
	};
})();
