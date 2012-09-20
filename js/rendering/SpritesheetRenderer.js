(function () {

	var ns = $.namespace("pskl.rendering");

	ns.SpritesheetRenderer = function (framesheet) {
		this.framesheet = framesheet;
	};

	/**
	 * Will open a new window displaying the spritesheet as a png 
	 */
	ns.SpritesheetRenderer.prototype.render = function () {
		var canvas = this.createCanvas_();
		for (var i = 0 ; i < this.framesheet.getFrameCount() ; i++) {
			var frame = this.framesheet.getFrameByIndex(i);
			this.drawFrameInCanvas_(frame, canvas, i * this.framesheet.getWidth(), 0);
		}
		this.openCanvasAsPNGInWindow_(canvas);
	};

	/**
	 * TODO : (Julz) Mutualize with code already present in FrameRenderer
	 */
	ns.SpritesheetRenderer.prototype.drawFrameInCanvas_ = function (frame, canvas, offsetWidth, offsetHeight) {
		var context = canvas.getContext('2d');
		for(var col = 0, width = frame.getWidth(); col < width; col++) {
			for(var row = 0, height = frame.getHeight(); row < height; row++) {
				var color = frame.getPixel(col, row);
				if(color != Constants.TRANSPARENT_COLOR) {
					context.fillStyle = color;
					context.fillRect(col + offsetWidth, row + offsetHeight, 1, 1);
				}
			}
		}
	};

	ns.SpritesheetRenderer.prototype.createCanvas_ = function () {
		var frameCount = this.framesheet.getFrameCount();
		if (frameCount > 0){
			var width = frameCount * this.framesheet.getWidth();
			var height = this.framesheet.getHeight();
			return pskl.CanvasUtils.createCanvas(width, height);
		} else {
			throw "Cannot render empty Spritesheet"
		}
	};

	ns.SpritesheetRenderer.prototype.openCanvasAsPNGInWindow_ = function (canvas) {
		var options = [
		"dialog=yes", "scrollbars=no", "status=no",
		"width=" + this.framesheet.getWidth() * this.framesheet.getFrameCount(),
		"height=" + this.framesheet.getHeight()
		].join(",");

		window.open(canvas.toDataURL("image/png"), "piskel-export", options);
	};
})();