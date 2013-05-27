(function () {
	var ns = $.namespace("pskl.selection");

	ns.BaseSelection = function () {
		this.reset();
	};

	ns.BaseSelection.prototype.reset = function () {
		this.pixels = [];
		this.hasPastedContent = false;
	};

	ns.BaseSelection.prototype.move = function (colDiff, rowDiff) {
		var movedPixel, movedPixels = [];

		for(var i=0, l=this.pixels.length; i<l; i++) {
			movedPixel = this.pixels[i];
			movedPixel.col += colDiff;
			movedPixel.row += rowDiff;
			movedPixels.push(movedPixel);
		}
		this.pixels = movedPixels;
	};

	ns.BaseSelection.prototype.fillSelectionFromFrame = function (targetFrame) {
		var pixelWithCopiedColor;
		for(var i=0, l=this.pixels.length; i<l; i++) {
			pixelWithCopiedColor = this.pixels[i];
			pixelWithCopiedColor.copiedColor =
				targetFrame.getPixel(pixelWithCopiedColor.col, pixelWithCopiedColor.row);
		}
		this.hasPastedContent = true;
	};
})();