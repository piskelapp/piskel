(function() {
	var ns = $.namespace("pskl.drawingtools");

	ns.MirrorPen = function() {
		this.toolId = "tool-vertical-mirror-pen";
		this.helpText = "Mirror pen tool";

		this.swap = null
		this.mirroredPreviousCol = null;
	    this.mirroredPreviousRow = null;
	};

	pskl.utils.inherit(ns.MirrorPen, ns.SimplePen);
	

	ns.MirrorPen.prototype.setMirrorContext = function() {
		this.swap = this.previousCol;
		this.previousCol = this.mirroredPreviousCol;
	};

	ns.MirrorPen.prototype.unsetMirrorContext = function() {
		this.mirroredPreviousCol = this.previousCol;
		this.previousCol = this.swap;
	};

	/**
	 * @override
	 */
	ns.MirrorPen.prototype.applyToolAt = function(col, row, color, frame, overlay) {
		this.superclass.applyToolAt.call(this, col, row, color, frame, overlay);

		var mirroredCol = this.getSymmetricCol_(col, frame);
		this.mirroredPreviousCol = mirroredCol;

		this.setMirrorContext();
		this.superclass.applyToolAt.call(this, mirroredCol, row, color, frame, overlay);
		this.unsetMirrorContext();
	};

	/**
	 * @private
	 */
	ns.MirrorPen.prototype.getSymmetricCol_ = function(col, frame) {
		return frame.getWidth() - col - 1; 
	};
})();
