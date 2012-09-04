(function () {
	var ns = $.namespace("pskl.model");
	ns.Frame = function (pixels) {
		this.pixels = pixels;
	};

	ns.Frame.createEmpty = function (width, height) {
		var pixels = []; //new Array(width);
		for (var columnIndex=0; columnIndex < width; columnIndex++) {
			var columnArray = [];
			for(var heightIndex = 0; heightIndex < height; heightIndex++) {
				columnArray.push(Constants.TRANSPARENT_COLOR);
			}
			pixels[columnIndex] = columnArray;
    	}
		return new ns.Frame(pixels);
	};

	ns.Frame.createEmptyFromFrame = function (frame) {
		return ns.Frame.createEmpty(frame.getWidth(), frame.getHeight());
	};

	ns.Frame.prototype.clone = function () {
		var clone = ns.Frame.createEmptyFromFrame(this);
		for (var col = 0 ; col < clone.getWidth() ; col++) {
			for (var row = 0 ; row < clone.getHeight() ; row++) {
				clone.setPixel(col, row, this.getPixel(col, row));
			}
		}
		return clone;
	};

	ns.Frame.prototype.setPixel = function (col, row, color) {
		this.pixels[col][row] = color;
	};

	ns.Frame.prototype.getPixel = function (col, row) {
		return this.pixels[col][row];
	};

	ns.Frame.prototype.getWidth = function () {
		return this.pixels.length;
	};

	ns.Frame.prototype.getHeight = function () {
		return this.pixels[0].length;
	};

	ns.Frame.prototype.containsPixel = function (col, row) {
		return col >= 0 && row >= 0 && col <= this.pixels.length && row <= this.pixels[0].length;
	};

})();